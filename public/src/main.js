import m from "mithril"
import { Home } from "./routes/home.js"
import { NoProject } from "./routes/no-project.js"

const root = document.body

m.route(root, "/no-project", {
    "/": Home,
    "/no-project": NoProject,
})