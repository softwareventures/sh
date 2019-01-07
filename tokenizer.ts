export interface Token {
    readonly type: "word" | "operator";
    readonly text: string;
}

export function tokenize(text: string): ReadonlyArray<Token> {
    let state: State = {
        mode: "token-boundary",
        tokens: [],
        text,
        position: 0
    };

    while (state.mode !== "end") {
        state = step(state);
    }

    return state.tokens;
}

interface State {
    readonly mode: "token-boundary" | "end";
    readonly tokens: ReadonlyArray<Token>;
    readonly text: string;
    readonly position: number;
}

function step(state: State): State {
    if (state.mode === "end") {
        throw new Error("Step past end of character stream");
    }

    if (state.position === state.text.length) {
        return {
            ...state,
            mode: "end"
        };
    }

    throw new Error("Not implemented");
}