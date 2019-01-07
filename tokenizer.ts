export interface Token {
    readonly type: "word" | "operator";
    readonly text: string;
}