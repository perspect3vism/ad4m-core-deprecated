import type { Address } from '../Address'
import type { AgentExpression } from '../agent/Agent'
import { DID } from '../DID';
import type { Expression } from '../expression/Expression'
import type { LinkQuery }  from '../perspectives/LinkQuery'
import { Perspective } from '../perspectives/Perspective';

export interface Language {
    readonly name: string;

    // Adapter implementations:
    // ExpressionAdapter implements means of getting an Expression
    // by address and putting an expression
    readonly expressionAdapter?: ExpressionAdapter;

    // Implementation of a Language that defines and stores Languages
    readonly languageAdapter?: LanguageAdapter;

    // Optional adapter for getting Expressions by author
    readonly getByAuthorAdapter?: GetByAuthorAdapter;
    // Optional adapter for getting all Expressions
    readonly getAllAdapter?: GetAllAdapter;
    // Optional adapter for direct messaging between agents
    readonly directMessageAdapter?: DirectMessageAdapter;
    // Optional adpater for sharing links
    readonly linksAdapter?: LinksAdapter;

    readonly expressionUI?: ExpressionUI;
    readonly settingsUI?: SettingsUI;

    // All available interactions this agent could execute on given expression
    interactions(expression: Address): Interaction[];
}

export interface ExpressionUI {
    // UI factories returning web components:
    icon(): string; // returns JS code that implements this Language's web component
    constructorIcon(): string;
}

export interface SettingsUI {
    settingsIcon(): string;
}

// This interface has to implementend by every language
export interface ExpressionAdapter {
    // Returns an Expression by address, or null if there is no Expression
    // with that given address
    get(address: Address): Promise<null | Expression>;

    // Strategy for putting an expression with needs to be different
    // for those two cases:
    // 1. PublicSharing means that this language supports the creation
    //    and sharing of Expressions, which is the common use-case
    // 2. ReadOnlyLanguage means that the Language implements a pre-defined
    //    set of expressions (which can be infinite or finite).
    //    For example the url-iframe Language which directly maps URLs to
    //    addresses - meaning every well formed URL is an address in this
    //    Language. Or a potential Language implementing the verbs/predicates
    //    of a spec like FOAF.
    putAdapter: PublicSharing | ReadOnlyLanguage;
}

// Implement this interface if your Language supports creation of sharing
// of Expressions.
// See ExpressionAdapter
export interface PublicSharing {
    kind: "PublicSharing";
    // Creates and Expression and shares it.
    // Returns the Expression's address.
    // * content is the object created by the constructorIcon component
    createPublic(content: object): Promise<Address>;
}

// Implement this interface if your Language is defined over a static
// set of pre-defined Expressions.
export interface ReadOnlyLanguage {
    kind: "ReadOnlyLanguage";
    // This just calculates the address of an object
    // * content is the object created by the constructorIcon component
    addressOf(content: object): Promise<Address>;
}

export interface LanguageAdapter {
    getLanguageSource(address: Address): Promise<string>;
}

// Implement this if your Language supports retrieval of all Expressions
// authored by a given agent
export interface GetByAuthorAdapter {
    /// Get expressions authored by a given Agent/Identity
    getByAuthor(author: DID, count: number, page: number): Promise<null | Expression[]>;
}

// Implement this if your Language supports retrievel of all Expressions
// stored in the space of that Language.
// Might not be trivial (without trade-off) for Holochain or DHTs
// in general - hence not a required interface.
export interface GetAllAdapter {
    /// Get expressions authored by a given Agent/Identity
    getAll(filter: any, count: number, page: number): Promise<null | Expression[]>;
}

export type NewLinksObserver = (added: Expression[], removed: Expression[])=>null;

// Implement this if your Language can share Links between Agents' Perspectives
export interface LinksAdapter {
    writable(): boolean;
    public(): boolean;
    others(): Promise<DID[]>;

    addLink(linkExpression: Expression);
    updateLink(oldLinkExpression: Expression, newLinkExpression: Expression);
    removeLink(link: Expression);
    render(): Promise<Perspective>

    getLinks(query: LinkQuery): Promise<Expression[]>;

    // Get push notified by added links
    addCallback(callback: NewLinksObserver);
}

// Implement this if your Langauge supports direct private messages
// between Agents
export interface DirectMessageAdapter {
    /// Send an expression to someone privately p2p
    sendPrivate(to: DID, content: object);
    /// Get private expressions sent to you
    inbox(filterFrom: null | DID[]): Promise<Expression[]>;
}

export interface Interaction {
    readonly label: string;
    readonly name: string;
    readonly parameters: [string, string][];
    execute(parameters: object);
}

export class InteractionCall {
    name: string;
    parameters: object;
}

export class OnlineAgent {
    did: DID
    status: string
}

export class TelepresenceRpcCall {
    fn_name: string
    params: object
}

export type TelepresenceRpcCallback = (call: TelepresenceRpcCall) => object;

export interface TelepresenceAdapter {
    setOnlineStatus(status: string);
    getOnlineAgents(): [OnlineAgent];

    rpcCall(remoteAgentDid: string, call: TelepresenceRpcCall): object;
    registerRpcCallback(callback: TelepresenceRpcCall);
}