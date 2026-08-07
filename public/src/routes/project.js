import m from "mithril"
import { MoreOptions } from "../components/more-options.js"
import { Modal } from "../components/modal.js"
import { cn } from "../lib/cn.js"

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
            const selectedImage = images.find(i => i.id === selectedImageId)

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
                selectedImage && m(Editor, { selectedImage })
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
                        m(".labels__item",
                            m(".labels__item__color", { style: `background-color: ${stringToColor(label.display_text)}` }),
                            m("input", {
                                type: "text",
                                value: label.display_text,
                                placeholder: "player",
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

    let mouse = {}
    let editorImage;

    onMouseUp()
    function onMouseUp() {
        Object.assign(mouse, {
            down: false,
            resize: false,
            focus: -1,
            focusDom: null,
            offsetX: 0,
            offsetY: 0
        })
    }

    function onMouseMove(e) {
        if (!mouse.down || mouse.focus === -1) {
            return
        }

        const rect = rects[mouse.focus]
        const pos = getMousePos(e)
        if (mouse.resize) {
            rect.width = (pos.x - rect.center_x) * 2
            rect.height = (pos.y - rect.center_y) * 2
        } else {
            rect.center_x = pos.x - mouse.offsetX
            rect.center_y = pos.y - mouse.offsetY
        }

        if (mouse.focusDom) {
            Object.assign(mouse.focusDom.style, {
                width: `${rect.width * 100}%`,
                height: `${rect.height * 100}%`,
                top: `${rect.center_y * 100}%`,
                left: `${rect.center_x * 100}%`,
            })
        }
    }

    function getMousePos(e) {
        const editorImageRect = editorImage.getBoundingClientRect()
        const x = (e.clientX - editorImageRect.left) / editorImageRect.width
        const y = (e.clientY - editorImageRect.top) / editorImageRect.height
        return { x, y }
    }

    return {
        async oninit({ attrs: { selectedImage } }) {
            rects = await m.request({
                method: "GET",
                url: `/api/images/${selectedImage.id}/rects`
            })
        },
        oncreate() {
            editorImage = document.querySelector(".editor__image")
            addEventListener("mouseup", onMouseUp)
            addEventListener("mousemove", onMouseMove)
        },
        onremove() {
            removeEventListener("mouseup", onMouseUp)
            removeEventListener("mousemove", onMouseMove)
        },
        view({ attrs: { selectedImage } }) {
            return m(Modal, {
                maxWidth: 1000,
                onclose() {
                    selectedImageId = null
                }
            },
                m(".editor",
                    m(".editor__image",
                        m("img", { src: selectedImage.source }),
                        rects.map((rect, i) => {
                            return m("div",
                                {
                                    class: cn("editor__rect", mouse.focus === i && "editor__rect--active"),
                                    style: {
                                        width: `${rect.width * 100}%`,
                                        height: `${rect.height * 100}%`,
                                        top: `${rect.center_y * 100}%`,
                                        left: `${rect.center_x * 100}%`,
                                    },
                                    onmousedown(e) {
                                        const offset = getMousePos(e)
                                        Object.assign(mouse, {
                                            down: true,
                                            focus: i,
                                            focusDom: e.target,
                                            offsetX: offset.x - rect.center_x,
                                            offsetY: offset.y - rect.center_y,
                                        })
                                    },
                                },
                                m(".editor__rect__handle", {
                                    onmousedown(e) {
                                        e.stopPropagation()
                                        Object.assign(mouse, {
                                            down: true,
                                            focus: i,
                                            focusDom: e.target.parentNode,
                                            resize: true
                                        })
                                    }
                                })
                            )
                        }),
                    ),
                    m(".editor__rects",
                        m(".editor__rects__list",
                            rects.map((rect, i) => {
                                const label = labels.find(l => l.id === rect.label_id)
                                if (!label) {
                                    return
                                }

                                return m("div",
                                    {
                                        class: cn("rect", mouse.focus === i && "rect--active"),
                                        onmousedown() {
                                            mouse.down = false
                                            mouse.focus = i
                                            mouse.resize = false
                                        }
                                    },
                                    m(".rect__color", { style: `background-color: ${stringToColor(label.display_text)}` }),
                                    m("select.button.rect__text",
                                        {
                                            value: rect.label_id,
                                            onchange(e) {
                                                const nextLabelId = parseInt(e.target.value)
                                                rects[i].label_id = nextLabelId
                                                m.request({
                                                    method: "PUT",
                                                    url: `/api/rects/${rect.id}`,
                                                    body: {
                                                        label_id: nextLabelId
                                                    }
                                                })
                                            }
                                        },
                                        labels.map(label => (
                                            m("option", { value: label.id }, label.display_text)
                                        ))
                                    ),
                                    m("button.button--square",
                                        {
                                            onclick() {
                                                rects = rects.filter(r => r.id !== rect.id)
                                                m.request({
                                                    method: "delete",
                                                    url: `/api/rects/${rect.id}`,
                                                })
                                            }
                                        },
                                        m("i.ri-delete-bin-line")
                                    ),
                                )
                            })
                        ),
                        m(".editor__rects__actions",
                            m("button",
                                {
                                    disabled: labels.length === 0,
                                    async onclick() {
                                        const rect = {
                                            image_id: selectedImage.id,
                                            label_id: labels[0].id,
                                            center_x: 0.5,
                                            center_y: 0.5,
                                            width: 0.5,
                                            height: 0.5,
                                        }

                                        const { id } = await m.request({
                                            method: "POST",
                                            url: "/api/rects",
                                            body: rect
                                        })

                                        rects.push({
                                            id,
                                            ...rect,
                                        })
                                    }
                                },
                                m("i.ri-square-line"),
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
    if (typeof str === "undefined" || str === "") {
        return "#eee"
    }

    let hash = 0;
    str.split('').forEach(char => {
        hash = char.charCodeAt(0) + ((hash << 5) - hash)
    })
    let colour = '#'
    for (let i = 0; i < 3; i++) {
        const value = (hash >> (i * 8)) & 0xff
        colour += value.toString(16).padStart(2, '0')
    }
    return colour
}
