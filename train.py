from ultralytics import YOLO

model = YOLO("yolo26n.pt")
results = model.train(
    data="dataset.yaml", epochs=100, imgsz=640, device="mps", freeze=10
)
