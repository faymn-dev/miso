import m from "mithril"

export function MoreOptions() {
    let ref;
    let open = false

    function onclick(e) {
        if (!(ref.contains(e.target) || e.target.isEqualNode(ref))) {
            open = false
            m.redraw()
        }
    }

    return {
        oninit() {
            addEventListener("click", onclick)
        },
        onremove() {
            removeEventListener("click", onclick)
        },
        oncreate({ dom }) {
            ref = dom
        },
        view({ children }) {
            return m(".more-options",
                {
                    onclick() {
                        open = true
                    }
                },
                m("button.button--square",
                    m("i.ri-more-2-line")
                ),
                open && m("div.more-options__content", children)
            )
        }
    }
}
