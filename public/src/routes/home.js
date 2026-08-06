import m from "mithril"
import { Layout } from "../layout.js"

export const Home = {
    view: () => {
        return m(Layout,
            m("h1", "Surviv.io"),
        )
    }
}