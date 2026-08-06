from flask import Flask, send_file

import database

app = Flask(__name__, static_url_path="", static_folder="public")


@app.route("/")
def home():
    return send_file("public/index.html")


@app.teardown_appcontext
def close_connection(_):
    database.close()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001)
