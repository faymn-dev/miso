import sqlite3

from flask import g

DATABASE_FILE = "miso.db"


def get():
    """
    Opens a new database connection for the current application context.
    """

    db = getattr(g, "_database", None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE_FILE)
        db.row_factory = sqlite3.Row
        db.execute("PRAGMA foreign_keys = ON;")  # enable foreign keys

    return db


def close():
    """
    Close database.
    """
    db = getattr(g, "_database", None)
    if db is not None:
        db.close()


def init():
    conn = get()
    cursor = conn.cursor()

    with open("./schema.sql") as file:
        schema = file.read()
        cursor.executescript(schema)

    conn.commit()


init()
