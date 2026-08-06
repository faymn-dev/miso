import m from "mithril"

export const Layout = {
    view: ({ children }) => m("div",
        { class: "layout" },
        m("header",
            { class: "header" },
            m("div",
                { class: "header__logo" },
                m("i", { class: "ri-bowl-line" }),
                m("h1", "miso")
            ),
            m("div",
                { class: "header__actions" },
                m("button",
                    m("i", { class: "ri-folder-download-line" }),
                    "Export"
                ),
                m("button",
                    { class: "settings" },
                    m("i", { class: "ri-settings-line" })
                )
            )
        ),
        m("div", children)
    )
}