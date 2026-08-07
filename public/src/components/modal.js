import m from "mithril"

export function Modal() {
    return {
        view({ attrs: { title, description, onclose }, children }) {
            return m("div", { class: "modal-background" },
                m("div", { class: "modal" },
                    m("div", { class: "modal__header" },
                        m("div",
                            { class: "section-text" },
                            title && m("h1", title),
                            description && m("p", description),
                        ),
                        m("button", { class: "button--square", onclick: onclose }, m("i", { class: "ri-close-line" }))
                    ),
                    m("div", { class: "modal__content" }, children)
                )
            )
        }
    }
}