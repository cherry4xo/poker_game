import random
from typing import List, Optional
from enum import Enum
from collections import Counter
from itertools import combinations

from fastapi import WebSocket
from pydantic import UUID4

from app import settings


class Deck:
    def __init__(self) -> None:
        self.suits = ['hearts', 'diamonds', 'clubs', 'spades']
        self.ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king', 'ace']
        self.cards = [Card(rank, suit) for suit in self.suits for rank in self.ranks]
        random.shuffle(self.cards)

    def deal_card(self):
        return self.cards.pop()


class Card:
    def __init__(self, rank, suit):
        self.rank = rank
        self.suit = suit

    def __str__(self):
        return f"{self.rank} of {self.suit}"
    
    def __repr__(self):
        return f"{self.rank}{self.suit[0]}"
    
    @property
    def dict(self):
        return {
            "rank": self.rank,
            "suit": self.suit
        }
    

class Hand:
    def __init__(self, cards: List[Card] = []):
        self.cards: List[Card] = sorted(cards, key=lambda card: self.rank_value(card.rank))
        self.ranks = [card.rank for card in self.cards]
        self.suits = [card.suit for card in self.cards]
        self.rank_counts = Counter(self.ranks)
        self.suit_counts = Counter(self.suits)

    @property
    def dict(self):
        return {
            "cards": [card.dict for card in self.cards],
            "ranks": self.ranks,
            "suits": self.suits,
            "rank_counts": dict(self.rank_counts),
            "suit_counts": dict(self.suit_counts)
        }

    def add_card(self, card):
        self.cards.append(card)
        self.cards = sorted(self.cards, key=lambda card: self.rank_value(card.rank))
        self.ranks = [card.rank for card in self.cards]
        self.suits = [card.suit for card in self.cards]
        self.rank_counts = Counter(self.ranks)
        self.suit_counts = Counter(self.suits)

    def rank_value(self, rank):
        if rank == 'ace':
            return 14
        elif rank == 'king':
            return 13
        elif rank == 'queen':
            return 12
        elif rank == 'jack':
            return 11
        else:
            return int(rank)

    def is_straight(self, ranks):
        values = [self.rank_value(rank) for rank in ranks]
        return values == list(range(min(values), max(values) + 1))

    def is_flush(self, suits):
        return len(set(suits)) == 1

    def is_four_of_a_kind(self, rank_counts):
        return 4 in rank_counts.values()

    def is_full_house(self, rank_counts):
        return 3 in rank_counts.values() and 2 in rank_counts.values()

    def is_three_of_a_kind(self, rank_counts):
        return 3 in rank_counts.values()

    def is_two_pair(self, rank_counts):
        return list(rank_counts.values()).count(2) == 2

    def is_pair(self, rank_counts):
        return 2 in rank_counts.values()

    def get_cards_by_rank(self, cards, rank) -> List[Card]:
        return [card for card in cards if card.rank == rank]

    def evaluate_hand(self, cards: List[Card]):
        ranks = [card.rank for card in cards]
        suits = [card.suit for card in cards]
        rank_counts = Counter(ranks)

        if self.is_straight(ranks) and self.is_flush(suits) and ranks == ['10', 'Jack', 'Queen', 'King', 'Ace']:
            return (9, [(card.rank, card.suit) for card in cards])  # Royal Flush
        elif self.is_straight(ranks) and self.is_flush(suits):
            return (8, [(card.rank, card.suit) for card in cards])  # Straight Flush
        elif self.is_four_of_a_kind(rank_counts):
            four_of_a_kind_rank = [rank for rank, count in rank_counts.items() if count == 4][0]
            four_of_a_kind_cards = self.get_cards_by_rank(cards, four_of_a_kind_rank)
            return (7, [(card.rank, card.suit) for card in four_of_a_kind_cards])  # Four of a Kind
        elif self.is_full_house(rank_counts):
            three_of_a_kind_rank = [rank for rank, count in rank_counts.items() if count == 3][0]
            pair_rank = [rank for rank, count in rank_counts.items() if count == 2][0]
            three_of_a_kind_cards = self.get_cards_by_rank(cards, three_of_a_kind_rank)
            pair_cards = self.get_cards_by_rank(cards, pair_rank)
            return (6, [(card.rank, card.suit) for card in three_of_a_kind_cards + pair_cards])  # Full House
        elif self.is_flush(suits):
            return (5, [(card.rank, card.suit) for card in cards])  # Flush
        elif self.is_straight(ranks):
            return (4, [(card.rank, card.suit) for card in cards])  # Straight
        elif self.is_three_of_a_kind(rank_counts):
            three_of_a_kind_rank = [rank for rank, count in rank_counts.items() if count == 3][0]
            three_of_a_kind_cards = self.get_cards_by_rank(cards, three_of_a_kind_rank)
            return (3, [(card.rank, card.suit) for card in three_of_a_kind_cards])  # Three of a Kind
        elif self.is_two_pair(rank_counts):
            pairs = [rank for rank, count in rank_counts.items() if count == 2]
            pair_cards = [card for rank in pairs for card in self.get_cards_by_rank(cards, rank)]
            return (2, [(card.rank, card.suit) for card in pair_cards])  # Two Pair
        elif self.is_pair(rank_counts):
            pair_rank = [rank for rank, count in rank_counts.items() if count == 2]
            if pair_rank:
                pair_rank = pair_rank[0]
                pair_cards = self.get_cards_by_rank(cards, pair_rank)
                return (1, [(card.rank, card.suit) for card in pair_cards])  # Pair
        else:
            return (0, [(card.rank, card.suit) for card in cards])  # High Card
        
    def evaluate(self):
        best_hand = (0, [])
        for combo in combinations(self.cards, 5):
            hand_value = self.evaluate_hand(combo)
            if hand_value[0] > best_hand[0]:
                best_hand = hand_value
            elif hand_value[0] == best_hand[0]:
                # Compare the ranks of the cards
                for card1, card2 in zip(hand_value[1], best_hand[1]):
                    rank_value1 = self.rank_value(card1[0])
                    rank_value2 = self.rank_value(card2[0])
                    if rank_value1 > rank_value2:
                        best_hand = hand_value
                        break
                    elif rank_value1 < rank_value2:
                        break
        return best_hand


def dict_to_pokerhand(hand_dict):
    hand = Hand()
    for card_dict in hand_dict.get('cards', []):
        card = Card(card_dict['rank'], card_dict['suit'])
        hand.add_card(card)
    return hand


class PlayerStatus(Enum):
    NOT_READY = 0
    READY = 1
    PLAYING = 2
    STAYING = 3
    PASS = 4
    ALL_IN = 5


class Player:
    def __init__(self, uuid: UUID4, name: str, websocket: Optional[WebSocket] = None, balance: float = None) -> None:
        self.id = uuid
        self.name = name
        self.balance = balance or settings.DEFAULT_START_BALANCE
        self.hand: Hand = Hand()
        self.currentbet = 0
        self.websocket: Optional[WebSocket] = websocket
        self.status = PlayerStatus.NOT_READY

    @classmethod
    async def create(cls, websocket: WebSocket, data: dict) -> "Player":
        player = Player(uuid=data["id"],
                        name=data["name"],
                        websocket=websocket,
                        balance=data["balance"])
        player.hand = dict_to_pokerhand(data["hand"])
        player.currentbet = data["currentbet"]
        player.status = PlayerStatus(data['status'])
        return player
    
    async def _bet(self, value: float) -> Optional[bool]:
        if self.status == PlayerStatus.ALL_IN:
            return 0
        try:
            if self.balance < value:
                delta = self.balance
                self.balance = 0
                self.status = PlayerStatus.ALL_IN
            else:
                delta = value
                self.balance -= delta
            self.currentbet += delta
            self.status = PlayerStatus.STAYING
            return delta
        except Exception:
            return None
        
    async def _call(self, bet: float) -> Optional[float]:
        if self.status == PlayerStatus.ALL_IN:
            return 0
        try:
            delta = bet - self.currentbet
            if self.balance < delta:
                delta = self.balance
                self.currentbet += delta
                self.balance = 0
                self.status = PlayerStatus.ALL_IN
            else:
                print(bet, delta)
                delta = bet - self.currentbet
                self.currentbet = bet
                self.balance -= delta
            return delta
        except Exception:
            return None
        
    async def _pass(self) -> bool:
        try:
            self.status = PlayerStatus.PASS
            return True
        except Exception:
            return None
        
    async def _raise(self, value: float) -> Optional[bool]:
        if self.status == PlayerStatus.ALL_IN:
            return 0
        try:
            if self.balance < value:
                delta = self.balance
                self.balance = 0
                self.status = PlayerStatus.ALL_IN
            else:
                delta = value
                self.balance -= delta
            self.currentbet += delta
            return delta
        except Exception:
            return None

    @property
    def dict(self) -> dict:
        data = {
            "id": self.id,
            "name": self.name,
            "balance": self.balance,
            "hand": self.hand.dict,
            "currentbet": self.currentbet,
            "status": self.status.value
        }
        return data