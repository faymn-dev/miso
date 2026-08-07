import m from "mithril"
import { Modal } from "../components/modal.js"

export function Projects() {
    let data = []
    let open = false
    let loading = true

    return {
        async oninit() {
            data = await m.request({
                method: "GET",
                url: "/api/projects"
            })
            loading = false
        },
        view() {
            if (loading) {
                return
            }

            if (data.length === 0) {
                return m("div", { class: "no-project layout" },
                    m("div", { class: "section-text" },
                        m("h1", "No projects found."),
                        m("p", "Projects allow you to organize labeled assets. You haven't created any yet."),
                    ),
                    m(CreateProjectForm),
                )
            }

            return m("div", { class: "projects layout" },
                m("div", { class: "projects__header" },
                    m("div", { class: "section-text" },
                        m("h1", "Projects"),
                    ),
                    m("button",
                        {
                            onclick() {
                                open = true
                            }
                        },
                        m("i", { class: "ri-add-line" }),
                        "Create Project"
                    ),
                ),
                m("div", { class: "projects__grid" },
                    data.map(p => (
                        m("a", { class: "projects__grid__item button", href: `#!/projects/${p.id}` },
                            m("i", { class: "ri-folder-line" }),
                            m("h1", p.title)
                        )
                    ))
                ),
                open && m(Modal, {
                    title: "Create Project", description: "Create a new project to organize assets.", onclose() {
                        open = false
                    }
                }, m(CreateProjectForm)),
            )
        },
    }
}

export function CreateProjectForm() {
    let loading = false

    async function submitForm() {
        if (loading) {
            return
        }

        loading = true
        const form = new FormData(document.querySelector(".no-project__form"))
        const resp = await fetch("/api/projects", { method: "POST", body: form })
        loading = false

        if (!resp.ok) {
            return
        }

        const { id } = await resp.json()
        m.route.set(`/projects/${id}`)
    }

    return {
        view() {
            return m("form",
                {
                    id: "no-project__form",
                    class: "no-project__form",
                    onsubmit(e) {
                        e.preventDefault()
                        submitForm()
                    },
                },
                m("input", {
                    id: "title", name: "title", type: "text", placeholder: "Surviv.io Annotated Data", required: true,
                }),
                m("input", {
                    id: "directory", name: "directory", type: "hidden", value: "."
                }),
                m("button",
                    {
                        type: "submit",
                        disabled: loading
                    },
                    m("i", { class: loading ? "ri-loader-3-line spinner" : "ri-add-line" }),
                    "Create Project"
                )
            )
        },

    }
}