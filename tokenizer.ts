import type {Dictionary} from "dictionary-types";

export interface Token {
    readonly type: "word" | "operator";
    readonly text: string;
}

export function tokenize(text: string): readonly Token[] {
    let state: State = {
        mode: "token-boundary",
        tokens: [],
        text,
        position: 0,
        token: ""
    };

    while (state.mode !== "end") {
        state = step(state);
    }

    return state.tokens;
}

interface State {
    readonly mode:
        | "token-boundary"
        | "in-word"
        | "in-operator"
        | "in-escape"
        | "in-single-quote"
        | "in-double-quote"
        | "end";
    readonly tokens: readonly Token[];
    readonly text: string;
    readonly position: number;
    readonly token: string;
}

function step(state: State): State {
    if (state.mode === "end") {
        throw new Error("Step past end of character stream");
    }

    if (state.position === state.text.length) {
        return {
            ...delimit(state),
            mode: "end"
        };
    }

    const char = state.text.charAt(state.position);
    const token = state.token + char;

    if (state.mode === "in-operator") {
        if (partialOperatorMap[token] ?? false) {
            return consumeChar(state);
        } else {
            return delimit(state);
        }
    }

    if (!quoting(state)) {
        if (char === "\\") {
            return consumeChar({...state, mode: "in-escape"});
        } else if (char === "'") {
            return consumeChar({...state, mode: "in-single-quote"});
        } else if (char === '"') {
            return consumeChar({...state, mode: "in-double-quote"});
        }
    }

    if (!hardQuoting(state)) {
        if (char === "$") {
            return consumeDollarExpansion(consumeChar(state));
        } else if (char === "`") {
            throw new Error("Not implemented");
        }
    }

    if (!quoting(state)) {
        if (partialOperatorMap[char] ?? false) {
            return consumeChar({...delimit(state), mode: "in-operator"});
        }

        if (char === " " || char === "\t") {
            return discardChar(delimit(state));
        }
    }

    if (state.mode === "in-word") {
        return consumeChar(state);
    }

    if (char === "#") {
        return discardComment(state);
    }

    return consumeChar({...state, mode: "in-word"});
}

function delimit(state: State): State {
    const tokenType =
        state.mode === "in-word" ? "word" : state.mode === "in-operator" ? "operator" : null;

    if (tokenType == null) {
        return state;
    } else {
        return {
            ...state,
            mode: "token-boundary",
            tokens: state.tokens.concat([
                {
                    type: tokenType,
                    text: state.token
                }
            ]),
            token: ""
        };
    }
}

const operators = ["<", ">", ">|", ">>", "<<", "<<-", "<&", ">&", "<>", "|", "&&", "||", ";", "&"];

const partialOperatorMap = operators.sort().reduce<Dictionary<boolean>>((map, operator) => {
    void operator.split("").reduce((partial, char) => {
        const p = partial + char;
        map[p] = true;
        return p;
    }, "");
    return map;
}, {});

function discardChar(state: State): State {
    return {
        ...state,
        position: state.position + 1
    };
}

function consumeChar(state: State): State {
    return {
        ...state,
        position: state.position + 1,
        token: state.token + state.text.charAt(state.position)
    };
}

function quoting(state: State): boolean {
    return (
        state.mode === "in-escape" ||
        state.mode === "in-single-quote" ||
        state.mode === "in-double-quote"
    );
}

function hardQuoting(state: State): boolean {
    return state.mode === "in-escape" || state.mode === "in-single-quote";
}

function discardComment(state: State): State {
    let i = state.position;
    while (i < state.text.length && state.text.charAt(i) !== "\n") {
        ++i;
    }
    return {...state, position: i};
}

function consumeDollarExpansion(state: State): State {
    const char = state.text.charAt(state.position);

    if (char === "{" || char === "(") {
        throw new Error("Not implemented");
    }

    return {
        ...state,
        mode: quoting(state) ? state.mode : "in-word"
    };
}
