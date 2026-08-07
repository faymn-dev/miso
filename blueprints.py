from flask import Blueprint, abort, request

import database


def create_blueprint(table_name: str, table_cols: list[str]):
    if table_cols[0] != "id":  # auto-insert id column
        table_cols.insert(0, "id")

    bp = Blueprint(f"{table_name}_bp", __name__)

    def to_json(row):
        if row is None or len(row) == 0:
            return None
        return dict(zip(table_cols, row))

    def get_input_data(existing=None) -> list:
        if existing is None:
            existing = {}

        payload = request.get_json(silent=True)
        if not isinstance(payload, dict):
            payload = request.form
        return [payload.get(col, existing.get(col)) for col in table_cols[1:]]

    sql_cols = ", ".join(table_cols[1:])
    sql_all = ", ".join(table_cols)
    sql_params = ", ".join(
        ["?"] * (len(table_cols) - 1)
    )  # one less because we want to auto-generate id

    @bp.post(f"/api/{table_name}")
    def create():
        conn = database.get()
        cursor = conn.cursor()

        cursor.execute(
            f"INSERT INTO {table_name} ({sql_cols}) VALUES ({sql_params}) RETURNING id",
            tuple(get_input_data()),
        )
        id = cursor.fetchone()[0]
        conn.commit()
        return {"id": id}

    @bp.get(f"/api/{table_name}")
    def get_all():
        conn = database.get()
        cursor = conn.cursor()

        cursor.execute(f"SELECT {sql_all} FROM {table_name}")
        projects = [to_json(row) for row in cursor.fetchall()]
        return projects

    @bp.get(f"/api/{table_name}/<int:id>")
    def get_one(id: int):
        conn = database.get()
        cursor = conn.cursor()

        cursor.execute(f"SELECT {sql_all} FROM {table_name} WHERE id = ?", (id,))
        result = to_json(cursor.fetchone())
        if result is None:
            abort(404)

        return result

    @bp.put(f"/api/{table_name}/<int:id>")
    def update(id: int):
        conn = database.get()
        cursor = conn.cursor()

        cursor.execute(f"SELECT {sql_all} FROM {table_name} WHERE id = ?", (id,))
        entry = to_json(cursor.fetchone())
        if entry is None:
            abort(404)

        new_data = get_input_data(entry)
        sql_set = ", ".join([f"{col} = ?" for col in table_cols[1:]])

        cursor.execute(
            f"UPDATE {table_name} SET {sql_set} WHERE id = ?",
            (*new_data, id),
        )
        conn.commit()

        return to_json([id, *new_data])

    @bp.delete(f"/api/{table_name}/<int:id>")
    def delete(id: int):
        conn = database.get()
        cursor = conn.cursor()
        cursor.execute(f"DELETE FROM {table_name} WHERE id = ?", (id,))
        conn.commit()
        if cursor.rowcount == 0:
            abort(404)
        return "", 204

    return bp
