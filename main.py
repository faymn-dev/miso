import glob
import os
import uuid
from pathlib import Path
import shutil


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


@app.post("/api/projects/<int:id>/export")
def export_project(id: int):
    conn = database.get()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM projects WHERE id = ?", (id,))
    project = cursor.fetchone()
    if project is None:
        abort(404)

    # get all labels associated with project
    cursor.execute("SELECT id, display_text FROM labels WHERE project_id = ?", (id,))
    labels = cursor.fetchall()

    label_id_to_index = {}
    for i in range(len(labels)):
        label_id = labels[i][0]
        label_id_to_index[label_id] = i

    # https://docs.ultralytics.com/yolov5/tutorials/train-custom-data#12-leverage-models-for-automated-labeling
    with open("dataset.yaml", "w", encoding="utf-8") as file:
        file.write("path: dataset\n\n")
        file.write("train: images/train\n\n")
        file.write("names:\n")
        file.writelines(f"  {i}: {labels[i][1]}\n" for i in range(len(labels)))

    # empty out dataset directory & ensure stuff exists
    os.makedirs("./dataset/images/train", exist_ok=True)
    os.makedirs("./dataset/labels/train", exist_ok=True)
    for file in glob.glob("./dataset/.*"):
        os.remove(file)

    # get all images and copy to train
    cursor.execute("SELECT id, source FROM images WHERE project_id = ?", (id,))
    images = cursor.fetchall()

    for image in images:
        image_id, image_path = image[0], image[1]

        # copy image to dataset
        shutil.copy(f"./public{image_path}", "./dataset/images/train")

        # get all rects associated with image
        filename = os.path.basename(image_path)
        cursor.execute(
            "SELECT label_id, center_x, center_y, width, height FROM rects WHERE image_id = ?",
            (image_id,),
        )
        rects = cursor.fetchall()

        # write rects to corresponding txt file
        with open(f"./dataset/labels/train/{filename}.txt", "w") as file:
            file.writelines(
                f"{label_id_to_index[rect[0]]} {rect[1]} {rect[2]} {rect[3]} {rect[4]}\n"
                for rect in rects
            )

    return "ok"


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
