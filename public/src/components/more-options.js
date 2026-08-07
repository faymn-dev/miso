import m from "mithril"

export function MoreOptions() {
    open = false
    return {
        view() {
            return m("div", { class: "more-options" },
                m("button", { class: "button--square" },
                    m("i", { class: "ri-more-2-line" })
                ),
            )
        }
    }
}