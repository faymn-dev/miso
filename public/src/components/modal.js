import m from "mithril"

export function Modal() {
    return {
        view({ attrs: { title, description, onclose, maxWidth = 512 }, children }) {
            return m(".modal-background",
                m(".modal",
                    { style: `max-width: ${maxWidth}px` },
                    (title || description) && m(".modal__header",
                        m(".section-text",
                            title && m("h2", title),
                            description && m("p", description),
                        ),
                    ),
                    m("button.button--square.modal__close", { onclick: onclose }, m("i.ri-close-line")),
                    m(".modal__content", children)
                )
            )
        }
    }
}