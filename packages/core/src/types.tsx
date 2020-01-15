import * as CommonActions from './CommonActions';
import * as React from 'react';

export type CommonAction = CommonActions.Action;

export type NavigationState = {
  /**
   * Unique key for the navigation state.
   */
  key: string;
  /**
   * Index of the currently focused route.
   */
  index: number;
  /**
   * List of valid route names as defined in the screen components.
   */
  routeNames: string[];
  /**
   * List of rendered routes.
   */
  routes: (Route<string> & {
    state?: NavigationState | PartialState<NavigationState>;
  })[];
  /**
   * Custom type for the state, whether it's for tab, stack, drawer etc.
   * During rehydration, the state will be discarded if type doesn't match with router type.
   * It can also be used to detect the type of the navigator we're dealing with.
   */
  type: string;
  /**
   * Whether the navigation state has been rehydrated.
   */
  stale: false;
};

export type InitialState = Partial<
  Omit<NavigationState, 'stale' | 'routes'>
> & {
  routes: (Omit<Route<string>, 'key'> & { state?: InitialState })[];
};

export type PartialState<State extends NavigationState> = Partial<
  Omit<State, 'stale' | 'type' | 'key' | 'routes' | 'routeNames'>
> & {
  stale?: true;
  type?: string;
  routes: (Omit<Route<string>, 'key'> & {
    key?: string;
    state?: InitialState;
  })[];
};

export type Route<RouteName extends string> = {
  /**
   * Unique key for the route.
   */
  key: string;
  /**
   * User-provided name for the route.
   */
  name: RouteName;
  /**
   * Params for the route.
   */
  params?: object;
};

export type NavigationAction = {
  /**
   * Type of the action (e.g. `NAVIGATE`)
   */
  type: string;
  /**
   * Additional data for the action
   */
  payload?: object;
  /**
   * Key of the route which dispatched this action.
   */
  source?: string;
  /**
   * Key of the navigator which should handle this action.
   */
  target?: string;
};

export type ActionCreators<Action extends NavigationAction> = {
  [key: string]: (...args: any) => Action;
};

export type DefaultRouterOptions = {
  /**
   * Name of the route to focus by on initial render.
   * If not specified, usually the first route is used.
   */
  initialRouteName?: string;
};

export type DefaultNavigatorOptions<
  ScreenOptions extends object
> = DefaultRouterOptions & {
  /**
   * Children React Elements to extract the route configuration from.
   * Only `Screen` components are supported as children.
   */
  children: React.ReactNode;
  /**
   * Default options for all screens under this navigator.
   */
  screenOptions?:
    | ScreenOptions
    | ((props: {
        route: RouteProp<ParamListBase, string>;
        navigation: any;
      }) => ScreenOptions);
};

export type RouterFactory<
  State extends NavigationState,
  Action extends NavigationAction,
  RouterOptions extends DefaultRouterOptions
> = (options: RouterOptions) => Router<State, Action>;

export type RouterConfigOptions = {
  routeNames: string[];
  routeParamList: ParamListBase;
};

export type Router<
  State extends NavigationState,
  Action extends NavigationAction
> = {
  /**
   * Type of the router. Should match the `type` property in state.
   * If the type doesn't match, the state will be discarded during rehydration.
   */
  type: State['type'];

  /**
   * Initialize the navigation state.
   *
   * @param options.routeNames List of valid route names as defined in the screen components.
   * @param options.routeParamsList Object containing params for each route.
   */
  getInitialState(options: RouterConfigOptions): State;

  /**
   * Rehydrate the full navigation state from a given partial state.
   *
   * @param partialState Navigation state to rehydrate from.
   * @param options.routeNames List of valid route names as defined in the screen components.
   * @param options.routeParamsList Object containing params for each route.
   */
  getRehydratedState(
    partialState: PartialState<State> | State,
    options: RouterConfigOptions
  ): State;

  /**
   * Take the current state and updated list of route names, and return a new state.
   *
   * @param state State object to update.
   * @param options.routeNames New list of route names.
   * @param options.routeParamsList Object containing params for each route.
   */
  getStateForRouteNamesChange(
    state: State,
    options: RouterConfigOptions
  ): State;

  /**
   * Take the current state and key of a route, and return a new state with the route focused
   *
   * @param state State object to apply the action on.
   * @param key Key of the route to focus.
   */
  getStateForRouteFocus(state: State, key: string): State;

  /**
   * Take the current state and action, and return a new state.
   * If the action cannot be handled, return `null`.
   *
   * @param state State object to apply the action on.
   * @param action Action object to apply.
   * @param options.routeNames List of valid route names as defined in the screen components.
   * @param options.routeParamsList Object containing params for each route.
   */
  getStateForAction(
    state: State,
    action: Action,
    options: RouterConfigOptions
  ): State | PartialState<State> | null;

  /**
   * Whether the action should also change focus in parent navigator
   *
   * @param action Action object to check.
   */
  shouldActionChangeFocus(action: NavigationAction): boolean;

  /**
   * Action creators for the router.
   */
  actionCreators?: ActionCreators<Action>;
};

export type ParamListBase = Record<string, object | undefined>;

export type EventMapBase = Record<
  string,
  { data?: any; canPreventDefault?: boolean }
>;

export type EventMapCore = {
  focus: { data: undefined };
  blur: { data: undefined };
};

export type EventArg<
  EventName extends string,
  CanPreventDefault extends boolean | undefined = false,
  Data = undefined
> = {
  /**
   * Type of the event (e.g. `focus`, `blur`)
   */
  readonly type: EventName;
} & (CanPreventDefault extends true
  ? {
      /**
       * Whether `event.preventDefault()` was called on this event object.
       */
      readonly defaultPrevented: boolean;
      /**
       * Prevent the default action which happens on this event.
       */
      preventDefault(): void;
    }
  : {}) &
  (Data extends undefined ? {} : { readonly data: Data });

export type EventListenerCallback<
  EventMap extends EventMapBase,
  EventName extends keyof EventMap
> = (
  e: EventArg<
    Extract<EventName, string>,
    EventMap[EventName]['canPreventDefault'],
    EventMap[EventName]['data']
  >
) => void;

export type EventConsumer<EventMap extends EventMapBase> = {
  /**
   * Subscribe to events from the parent navigator.
   *
   * @param type Type of the event (e.g. `focus`, `blur`)
   * @param callback Callback listener which is executed upon receiving the event.
   */
  addListener<EventName extends Extract<keyof EventMap, string>>(
    type: EventName,
    callback: EventListenerCallback<EventMap, EventName>
  ): () => void;
  removeListener<EventName extends Extract<keyof EventMap, string>>(
    type: EventName,
    callback: EventListenerCallback<EventMap, EventName>
  ): void;
};

export type EventEmitter<EventMap extends EventMapBase> = {
  /**
   * Emit an event to child screens.
   *
   * @param options.type Type of the event (e.g. `focus`, `blur`)
   * @param [options.data] Optional information regarding the event.
   * @param [options.target] Key of the target route which should receive the event.
   * If not specified, all routes receive the event.
   */
  emit<EventName extends Extract<keyof EventMap, string>>(
    options: {
      type: EventName;
      target?: string;
    } & (EventMap[EventName]['canPreventDefault'] extends true
      ? { canPreventDefault: true }
      : {}) &
      (EventMap[EventName]['data'] extends undefined
        ? {}
        : { data: EventMap[EventName]['data'] })
  ): EventArg<
    EventName,
    EventMap[EventName]['canPreventDefault'],
    EventMap[EventName]['data']
  >;
};

export class PrivateValueStore<A, B, C> {
  /**
   * UGLY HACK! DO NOT USE THE TYPE!!!
   *
   * TypeScript requires a type to be used to be able to infer it.
   * The type should exist as its own without any operations such as union.
   * So we need to figure out a way to store this type in a property.
   * The problem with a normal property is that it shows up in intelliSense.
   * Adding private keyword works, but the annotation is stripped away in declaration.
   * Turns out if we use an empty string, it doesn't show up in intelliSense.
   */
  protected ''?: { a: A; b: B; c: C };
}

type NavigationHelpersCommon<
  ParamList extends ParamListBase,
  State extends NavigationState = NavigationState
> = {
  /**
   * Dispatch an action or an update function to the router.
   * The update function will receive the current state,
   *
   * @param action Action object or update function.
   */
  dispatch(
    action: NavigationAction | ((state: State) => NavigationAction)
  ): void;

  /**
   * Navigate to a route in current navigation tree.
   *
   * @param name Name of the route to navigate to.
   * @param [params] Params object for the route.
   */
  navigate<RouteName extends keyof ParamList>(
    ...args: ParamList[RouteName] extends undefined | any
      ? [RouteName] | [RouteName, ParamList[RouteName]]
      : [RouteName, ParamList[RouteName]]
  ): void;

  /**
   * Navigate to a route in current navigation tree.
   *
   * @param route Object with `key` or `name` for the route to navigate to, and a `params` object.
   */
  navigate<RouteName extends keyof ParamList>(
    route:
      | { key: string; params?: ParamList[RouteName] }
      | { name: RouteName; key?: string; params: ParamList[RouteName] }
  ): void;

  /**
   * Replace the current route with a new one.
   *
   * @param name Route name of the new route.
   * @param [params] Params object for the new route.
   */
  replace<RouteName extends keyof ParamList>(
    ...args: ParamList[RouteName] extends undefined
      ? [RouteName] | [RouteName, ParamList[RouteName]]
      : [RouteName, ParamList[RouteName]]
  ): void;

  /**
   * Reset the navigation state to the provided state.
   *
   * @param state Navigation state object.
   */
  reset(state: PartialState<State> | State): void;

  /**
   * Reset the navigation state of the root navigator to the provided state.
   *
   * @param state Navigation state object.
   */
  resetRoot(state?: PartialState<NavigationState> | NavigationState): void;

  /**
   * Go back to the previous route in history.
   */
  goBack(): void;

  /**
   * Check if the screen is focused. The method returns `true` if focused, `false` otherwise.
   * Note that this method doesn't re-render screen when the focus changes. So don't use it in `render`.
   * To get notified of focus changes, use `addListener('focus', cb)` and `addListener('blur', cb)`.
   * To conditionally render content based on focus state, use the `useIsFocused` hook.
   */
  isFocused(): boolean;

  /**
   * Check if dispatching back action will be handled by navigation.
   * Note that this method doesn't re-render screen when the result changes. So don't use it in `render`.
   */
  canGoBack(): boolean;
} & PrivateValueStore<ParamList, keyof ParamList, {}>;

export type NavigationHelpers<
  ParamList extends ParamListBase,
  EventMap extends EventMapBase = {}
> = NavigationHelpersCommon<ParamList> &
  EventEmitter<EventMap> & {
    /**
     * Update the param object for the route.
     * The new params will be shallow merged with the old one.
     *
     * @param params Params object for the current route.
     */
    setParams<RouteName extends keyof ParamList>(
      params: Partial<ParamList[RouteName]>
    ): void;
  };

export type NavigationContainerProps = {
  /**
   * Initial navigation state for the child navigators.
   */
  initialState?: InitialState;
  /**
   * Callback which is called with the latest navigation state when it changes.
   */
  onStateChange?: (state: NavigationState | undefined) => void;
  /**
   * Whether this navigation container should be independent of parent containers.
   * If this is not set to `true`, this container cannot be nested inside another container.
   * Setting it to `true` disconnects any children navigators from parent container.
   */
  independent?: boolean;
  /**
   * Children elements to render.
   */
  children: React.ReactNode;
};

export type NavigationProp<
  ParamList extends ParamListBase,
  RouteName extends keyof ParamList = string,
  State extends NavigationState = NavigationState,
  ScreenOptions extends object = {},
  EventMap extends EventMapBase = {}
> = NavigationHelpersCommon<ParamList, State> & {
  /**
   * Update the param object for the route.
   * The new params will be shallow merged with the old one.
   *
   * @param params Params object for the current route.
   */
  setParams(params: Partial<ParamList[RouteName]>): void;

  /**
   * Update the options for the route.
   * The options object will be shallow merged with default options object.
   *
   * @param options Options object for the route.
   */
  setOptions(options: Partial<ScreenOptions>): void;

  /**
   * Returns the parent navigator, if any. Reason why the function is called
   * dangerouslyGetParent is to warn developers against overusing it to eg. get parent
   * of parent and other hard-to-follow patterns.
   */
  dangerouslyGetParent<T = NavigationProp<ParamListBase> | undefined>(): T;

  /**
   * Returns the navigator's state. Reason why the function is called
   * dangerouslyGetState is to discourage developers to use internal navigation's state.
   * Note that this method doesn't re-render screen when the result changes. So don't use it in `render`.
   */
  dangerouslyGetState(): State;
} & EventConsumer<EventMap & EventMapCore> &
  PrivateValueStore<ParamList, RouteName, EventMap>;

export type RouteProp<
  ParamList extends ParamListBase,
  RouteName extends keyof ParamList
> = Omit<Route<Extract<RouteName, string>>, 'params'> &
  (ParamList[RouteName] extends undefined
    ? {}
    : {
        /**
         * Params for this route
         */
        params: ParamList[RouteName];
      });

export type CompositeNavigationProp<
  A extends NavigationProp<ParamListBase, string, any, any>,
  B extends NavigationHelpersCommon<ParamListBase, any>
> = Omit<A & B, keyof NavigationProp<any>> &
  NavigationProp<
    /**
     * Param list from both navigation objects needs to be combined
     * For example, we should be able to navigate to screens in both A and B
     */
    (A extends NavigationHelpersCommon<infer T> ? T : never) &
      (B extends NavigationHelpersCommon<infer U> ? U : never),
    /**
     * The route name should refer to the route name specified in the first type
     * Ideally it should work for any of them, but it's not possible to infer that way
     */
    A extends NavigationProp<any, infer R> ? R : string,
    /**
     * The type of state should refer to the state specified in the first type
     */
    A extends NavigationProp<any, any, infer S> ? S : NavigationState,
    /**
     * Screen options from both navigation objects needs to be combined
     * This allows typechecking `setOptions`
     */
    (A extends NavigationProp<any, any, any, infer O> ? O : {}) &
      (B extends NavigationProp<any, any, any, infer P> ? P : {}),
    /**
     * Event consumer config should refer to the config specified in the first type
     * This allows typechecking `addListener`/`removeListener`
     */
    A extends NavigationProp<any, any, any, any, infer E> ? E : {}
  >;

export type Descriptor<
  ParamList extends ParamListBase,
  RouteName extends keyof ParamList = string,
  State extends NavigationState = NavigationState,
  ScreenOptions extends object = {},
  EventMap extends EventMapBase = {}
> = {
  /**
   * Render the component associated with this route.
   */
  render(): JSX.Element;

  /**
   * Options for the route.
   */
  options: ScreenOptions;

  /**
   * Navigation object for the screen
   */
  navigation: NavigationProp<
    ParamList,
    RouteName,
    State,
    ScreenOptions,
    EventMap
  >;
};

export type RouteConfig<
  ParamList extends ParamListBase,
  RouteName extends keyof ParamList,
  ScreenOptions extends object
> = {
  /**
   * Route name of this screen.
   */
  name: RouteName;

  /**
   * Navigator options for this screen.
   */
  options?:
    | ScreenOptions
    | ((props: {
        route: RouteProp<ParamList, RouteName>;
        navigation: any;
      }) => ScreenOptions);

  /**
   * Initial params object for the route.
   */
  initialParams?: Partial<ParamList[RouteName]>;
} & (
  | {
      /**
       * React component to render for this screen.
       */
      component: React.ComponentType<{
        route: RouteProp<ParamList, RouteName>;
        navigation: any;
      }>;
    }
  | {
      /**
       * Render callback to render content of this screen.
       */
      children: (props: {
        route: RouteProp<ParamList, RouteName>;
        navigation: any;
      }) => React.ReactNode;
    }
);

export type NavigationContainerRef =
  | (NavigationHelpers<ParamListBase> & {
      /**
       * Reset the navigation state of the root navigator to the provided state.
       *
       * @param state Navigation state object.
       */
      resetRoot(state?: PartialState<NavigationState> | NavigationState): void;
      getRootState(): NavigationState;
    })
  | undefined
  | null;

export type TypedNavigator<
  ParamList extends ParamListBase,
  ScreenOptions extends object,
  Navigator extends React.ComponentType<any>
> = {
  /**
   * Navigator component which manages the child screens.
   */
  Navigator: React.ComponentType<
    Omit<
      React.ComponentProps<Navigator>,
      'initialRouteName' | 'screenOptions'
    > & {
      /**
       * Name of the route to focus by on initial render.
       * If not specified, usually the first route is used.
       */
      initialRouteName?: keyof ParamList;
      /**
       * Default options for all screens under this navigator.
       */
      screenOptions?:
        | ScreenOptions
        | ((props: {
            route: RouteProp<ParamList, keyof ParamList>;
            navigation: any;
          }) => ScreenOptions);
    }
  >;
  /**
   * Component used for specifying route configuration.
   */
  Screen: <RouteName extends keyof ParamList>(
    _: RouteConfig<ParamList, RouteName, ScreenOptions>
  ) => null;
};
