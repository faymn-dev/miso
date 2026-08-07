import m from "mithril"

export function Project() {
    let project = {}
    let labels = []

    return {
        async oninit({ attrs: { id } }) {
            project = await m.request({
                method: "GET",
                url: `/api/projects/${id}`
            })

            labels = await m.request({
                method: "GET",
                url: `/api/projects/${id}/labels`
            })
        },
        view({ attrs: { id } }) {
            return m("div", { class: "projects layout" },
                m("div", { class: "projects__title" },
                    m("div", { class: "section-text" },
                        m("h1", project.title),
                    ),
                    m("button",
                        m("i", { class: "ri-download-line" }),
                        "Download Dataset"
                    ),
                ),
                m("section",
                    { class: "project__section" },
                    m("div", { class: "project__section__title" },
                        m("h2", "Labels"),
                        m("button",
                            {
                                async onclick() {
                                    const label = await m.request({
                                        method: "POST",
                                        url: "/api/labels",
                                        body: {
                                            project_id: parseInt(id),
                                            display_text: "",
                                        }
                                    })
                                    labels.push(label)
                                }
                            },
                            m("i", { class: "ri-add-line" }),
                            "Add Label"
                        )
                    ),
                    m("div", { class: "labels" },
                        labels.map((label, i) => (
                            m("div.labels__item",
                                m("div.labels__item__color", { style: `background-color: ${stringToColor(label.display_text)}` }),
                                m("input", {
                                    type: "text",
                                    value: label.display_text,
                                    placeholder: "Player",
                                    async onchange(e) {
                                        const nextText = e.target.value
                                        labels[i].display_text = nextText
                                        await m.request({
                                            method: "PUT",
                                            url: `/api/labels/${label.id}`,
                                            body: {
                                                project_id: parseInt(id),
                                                display_text: nextText,
                                            }
                                        })
                                    }
                                }),
                                m("button.button--square",
                                    {
                                        async onclick() {
                                            labels = labels.filter(l => l.id !== label.id)
                                            await m.request({
                                                method: "DELETE",
                                                url: `/api/labels/${label.id}`,
                                            })
                                        }
                                    },
                                    m("i.ri-delete-bin-line")
                                ),
                            )
                        )),
                    )
                ),
                m("section",
                    { class: "project__section" },
                    m("h2", "Media"),
                    m("div", { class: "media" })
                )
            )
        }
    }
}

function stringToColor(str) {
    if (typeof str === "undefined") {
        return "#eee"
    }

    let hash = 0;
    str.toLowerCase().split('').forEach(char => {
        hash = char.charCodeAt(0) + ((hash << 5) - hash)
    })
    let colour = '#'
    for (let i = 0; i < 3; i++) {
        const value = (hash >> (i * 8)) & 0xff
        colour += value.toString(16).padStart(2, '0')
    }
    return colour
}
