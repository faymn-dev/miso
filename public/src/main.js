import m from "mithril"
import { Project } from "./routes/project.js"
import { Projects } from "./routes/projects.js"

const root = document.body

m.route(root, "/projects", {
    "/projects": Projects,
    "/projects/:id": new Project(),
})