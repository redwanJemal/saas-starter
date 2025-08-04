export interface RouteContext<T = { id: string }> {
    params: Promise<T>;
}