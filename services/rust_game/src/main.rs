use futures_util::{StreamExt, SinkExt};
use tokio::net::{TcpStream, TcpListener};
use tokio_tungstenite::accept_async;
use tokio::sync::mpsc;
use regex::Regex;
use rand::Rng;
use types::{Connection, BroadcastEvents, UserFileMessage};
use game::Game;

mod types;
mod game;
mod broadcast;

#[tokio::main]
async fn main() {
    let server = TcpListener::bind("0.0.0.0:8080").await.unwrap();

    let (broadcast_sender, broadcast_reciever) = mpsc::unbounded_channel::<BroadcastEvents>();

    tokio::spawn(broadcast::run(broadcast_reciever));

    let game = Game::new(broadcast_sender);

    loop {
        let (stream, _) = server.accept().await.unwrap();
        tokio::spawn(process_con(stream, game.clone()));
    }
}


async fn process_con(stream: TcpStream, game: Game) {
	let id = rand::thread_rng().gen::<u32>();
	let websocket = accept_async(stream).await.unwrap();

	let (mut sender, mut receiver) = websocket.split();
	let mut username = String::new(); 

	let _ = sender.send(game.get_list_message()).await;

	game.add_connection(Connection {
		id,
		con: sender,
	});

	// Waits for join message
	while let Some(msg) = receiver.next().await {
		if let Ok(msg) = msg {
			if !msg.is_text() {
				continue;
			}
			if let Ok(data) = msg.clone().into_text() {
				let re = Regex::new(r"JOIN\|[A-Za-z0-9]*$").unwrap();
				if re.is_match(&data) {
					username = (&data[5..]).to_owned();
					if username.len() > 13 {
						continue;
					}
					game.add_player(username.clone());
					break;
				}
			}
		} else {
			game.remove_player(username, id);
			return;
		}
	}

	// Process files
	while let Some(msg) = receiver.next().await {
		if let Ok(msg) = msg {
			if !msg.is_binary() {
				continue;
			}
			if let Some(data) = UserFileMessage::from(msg.clone().into_data()) {
				if data.file_bytes.len() > 5_000_000 && data.username == username {
					continue;
				}

				game.send_file(data.username, msg);
			}
		} else {
			break;
		}
	}
	game.remove_player(username, id);
}
