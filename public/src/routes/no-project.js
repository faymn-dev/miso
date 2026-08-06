import m from "mithril"

export const NoProject = {
    view: () => {
        return m("div", { class: "no-project layout" },
            m("div", { class: "section-text" },
                m("h1", "No projects found."),
                m("p", "Projects allow you to organize labeled assets. You haven't created any yet."),
            ),
            m("form", { class: "no-project__form", onsubmit: (e) => { e.preventDefault() } },
                m("input", { type: "text", placeholder: "Surviv.io Annotated Data", required: true }),
                m("button",
                    {
                        onclick: () => {
                        }
                    },
                    m("i", { class: "ri-add-line" }),
                    "Create Project"
                )
            )
        )
    }
}

const submitForm = () => {

}