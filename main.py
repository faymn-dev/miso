from flask import Flask, send_file

import database
from blueprints import create_blueprint

app = Flask(__name__, static_url_path="", static_folder="public")


with app.app_context():
    database.init()


@app.teardown_appcontext
def close_connection(_):
    database.close()


@app.route("/")
def home():
    return send_file("public/index.html")


app.register_blueprint(create_blueprint("labels", ["project_id", "display_text"]))


@app.get("/api/projects/<int:id>/labels")
def get_labels(id: int):
    conn = database.get()
    cursor = conn.cursor()

    cursor.execute("SELECT id, display_text FROM labels WHERE project_id = ?", (id,))
    labels = cursor.fetchall()

    return [dict(zip(["id", "display_text"], label)) for label in labels]


# basic crud operations for entities
app.register_blueprint(create_blueprint("projects", ["title", "directory"]))
app.register_blueprint(create_blueprint("images", ["project_id", "source"]))
app.register_blueprint(
    create_blueprint(
        "rects", ["image_id", "label_id", "center_x", "center_y", "width", "height"]
    )
)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001)
