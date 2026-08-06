import m from "mithril"

export class Project {
    async oninit({ attrs }) {
        const id = attrs.id
        const resp = await fetch(`/api/projects/${id}`)
        if (!resp.ok) {
            return
        }

        m.route.set(`/projects/${id}`)
    }

    view({ attrs }) {
        return m("div", "hi")
    }
}