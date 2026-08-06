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


app.register_blueprint(create_blueprint("projects", ["title", "directory"]))
app.register_blueprint(create_blueprint("labels", ["project_id", "display_text"]))
app.register_blueprint(create_blueprint("videos", ["project_id", "source"]))
app.register_blueprint(create_blueprint("images", ["project_id", "video_id", "source"]))
app.register_blueprint(
    create_blueprint(
        "rects", ["image_id", "label_id", "center_x", "center_y", "width", "height"]
    )
)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001)
