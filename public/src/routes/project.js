import m from "mithril"
import { MoreOptions } from "../components/more-options.js"
import { Modal } from "../components/modal.js"

let project = {}
let labels = []
let images = []
let selectedImageId = null

export function Project() {
    return {
        async oninit({ attrs: { id } }) {
            project = await m.request({
                method: "GET",
                url: `/api/projects/${id}`
            })
        },
        view({ attrs: { id } }) {
            return m(".projects.layout",
                m(".projects__header",
                    m(".projects__header__title",
                        m("a.button.button--square",
                            { href: "#!/projects" },
                            m("i.ri-home-line"),
                        ),
                        m("h1", project.title),
                    ),
                    m(".projects__header__title",
                        m("button",
                            m("i.ri-download-line"),
                            "Download Dataset"
                        ),
                        m(MoreOptions,
                            m("button", {
                                async onclick() {
                                    await m.request({
                                        method: "DELETE",
                                        url: `/api/projects/${id}`
                                    })
                                    m.route.set(`/projects`)
                                }
                            }, m("i.ri-delete-bin-line"), "Delete")
                        )
                    )
                ),
                m(Labels, { id }),
                m(Media, { id }),
                m(Editor)
            )
        }
    }
}


function Labels() {
    return {
        async oninit({ attrs: { id } }) {
            labels = await m.request({
                method: "GET",
                url: `/api/projects/${id}/labels`
            })
        },
        view({ attrs: { id } }) {
            return m("section",
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

                                setTimeout(function () {
                                    document.querySelector(".labels .labels__item:last-child input")?.focus()
                                }, 50)
                            }
                        },
                        m("i", { class: "ri-add-line" }),
                        "Add Label"
                    )
                ),
                m("div", { class: "labels" },
                    labels.length === 0 && m("p", "You haven't created any labels yet."),
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
            )
        }
    }
}

function Media() {
    return {
        async oninit({ attrs: { id } }) {
            images = await m.request({
                method: "GET",
                url: `/api/projects/${id}/images`
            })
        },
        view({ attrs: { id } }) {
            return m("section.project__section",
                m(".project__section__title",
                    m("h2", "Media"),
                    m("button",
                        {
                            async onclick() {
                                document.getElementById("file")?.click()
                            }
                        },
                        m("i.ri-file-image-line"),
                        "Upload Images"
                    )
                ),
                m("div.images",
                    images.length === 0 && m("p", "You haven't uploaded any images yet."),
                    images.map(({ id: imageId, source }) => (
                        m(".image",
                            {
                                onclick() {
                                    selectedImageId = imageId
                                }
                            },
                            m("img", { src: source }),
                            m("button.button--square",
                                {
                                    async onclick(e) {
                                        e.stopPropagation()
                                        images = images.filter(i => i.id !== imageId)
                                        await m.request({
                                            method: "DELETE",
                                            url: `/api/images/${imageId}`,
                                        })
                                    }
                                },
                                m("i.ri-delete-bin-line")
                            )
                        )
                    ))
                ),
                m("input.hidden", {
                    id: "file", type: "file", multiple: true, accept: "image/png, image/jpeg",
                    async onchange(e) {
                        const files = [...e.target.files].filter(file => !!file)

                        await Promise.all(files.map(async (file) => {
                            const formData = new FormData()
                            formData.append("file", file)

                            const { file: filePath } = await m.request({
                                method: "POST",
                                url: "/api/upload",
                                body: formData,
                            })

                            const payload = {
                                project_id: parseInt(id),
                                source: filePath,
                            }

                            const image = await m.request({
                                method: "POST",
                                url: "/api/images",
                                body: payload
                            })

                            images.push({
                                id: image.id,
                                ...payload
                            })
                        }))

                        m.redraw()
                    }
                })
            )
        }
    }
}

function Editor() {
    let rects = []

    return {
        view() {
            if (selectedImageId === null) {
                return
            }

            const image = images.filter(i => i.id === selectedImageId)[0]
            if (!image) {
                return
            }

            return m(Modal, {
                maxWidth: 1000,
                onclose() {
                    selectedImageId = null
                }
            },
                m(".editor",
                    m(".editor__image",
                        m("img", { src: image.source })
                    ),
                    m(".editor__rects",
                        m(".editor__rects__list",
                            m(".rect",
                                m(".rect__color"),
                                m("span", "player")
                            )
                        ),
                        m(".editor__rects__action",
                            m("button",
                                m("i.ri-add-line"),
                                "Add Rect"
                            )
                        )
                    )
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
