CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY,

    title TEXT NOT NULL,
    directory TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS labels (
    id INTEGER PRIMARY KEY,
    project_id INTEGER NOT NULL,

    display_text TEXT NOT NULL,

    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS videos (
    id INTEGER PRIMARY KEY, 
    project_id INTEGER NOT NULL, 

    source TEXT NOT NULL,

    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS images (
    id INTEGER PRIMARY KEY, 
    project_id INTEGER NOT NULL, 
    video_id INTEGER, 

    source TEXT NOT NULL,

    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS rects (
    id INTEGER PRIMARY KEY,
    image_id INTEGER NOT NULL, 
    label_id INTEGER NOT NULL,

    center_x REAL NOT NULL, 
    center_y REAL NOT NULL, 
    width REAL NOT NULL,
    height REAL NOT NULL, 

    CHECK (center_x BETWEEN 0 AND 1),
    CHECK (center_y BETWEEN 0 AND 1),
    CHECK (width BETWEEN 0 AND 1),
    CHECK (height BETWEEN 0 AND 1),

    FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE CASCADE,
    FOREIGN KEY (label_id) REFERENCES labels(id) ON DELETE CASCADE
);