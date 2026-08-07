import os
import uuid
from pathlib import Path

from flask import Flask, abort, request, send_file

import database
from blueprints import create_blueprint
from utils import is_allowed_file

app = Flask(__name__, static_url_path="", static_folder="public")


with app.app_context():
    database.init()


@app.teardown_appcontext
def close_connection(_):
    database.close()


@app.route("/")
def home():
    return send_file("public/index.html")


@app.post("/api/upload")
def upload():
    if "file" not in request.files:
        abort(400)

    file = request.files["file"]
    if file.filename == "" or not is_allowed_file(file.filename):
        abort(400)

    ext = Path(file.filename).suffix
    filename = str(uuid.uuid4()) + ext
    file.save(os.path.join("./public/uploads", filename))

    return {"file": f"/uploads/{filename}"}


@app.get("/api/projects/<int:id>/labels")
def get_labels(id: int):
    conn = database.get()
    cursor = conn.cursor()
    cursor.execute("SELECT id, display_text FROM labels WHERE project_id = ?", (id,))
    labels = cursor.fetchall()
    return [dict(zip(["id", "display_text"], label)) for label in labels]


@app.get("/api/projects/<int:id>/images")
def get_media(id: int):
    conn = database.get()
    cursor = conn.cursor()
    cursor.execute("SELECT id, source FROM images WHERE project_id = ?", (id,))
    labels = cursor.fetchall()
    return [dict(zip(["id", "source"], label)) for label in labels]


@app.get("/api/images/<int:id>/rects")
def get_rects(id: int):
    cols = ["id", "label_id", "center_x", "center_y", "width", "height"]

    conn = database.get()
    cursor = conn.cursor()
    cursor.execute(
        f"SELECT {', '.join(cols)} FROM rects WHERE image_id = ?",
        (id,),
    )
    labels = cursor.fetchall()

    return [dict(zip(cols, label)) for label in labels]


# basic crud operations for entities
app.register_blueprint(create_blueprint("projects", ["title", "directory"]))
app.register_blueprint(create_blueprint("labels", ["project_id", "display_text"]))
app.register_blueprint(create_blueprint("images", ["project_id", "source"]))
app.register_blueprint(
    create_blueprint(
        "rects", ["image_id", "label_id", "center_x", "center_y", "width", "height"]
    )
)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001)
