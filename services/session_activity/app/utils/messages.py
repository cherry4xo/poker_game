from uuid import UUID


def delete_message(id: UUID) -> str:
    return f"delete:{id}"