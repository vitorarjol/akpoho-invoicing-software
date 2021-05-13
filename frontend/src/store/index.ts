/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
//import { store } from 'quasar/wrappers';
import { createStore, GetterTree, useStore as baseUseStore, Store } from 'vuex';
import { InjectionKey } from 'vue';
import menus from './menus';
import auth from './auth';
import customers from './customers';
import { MenusStateInterface } from './menus/state';
import { AuthStateInterface } from './auth/state';
import { CustomersStateInterface } from './customers/state';
import { AuthGettersInterface } from './auth/getters';
import { CustomersGetterInterface } from './customers/getters';
import { MenusGettersInterface } from './menus/getters';
import { createLogger } from 'vuex';
import createPersistedState from 'vuex-persistedstate';

import SecureLS from 'secure-ls';
const ls = new SecureLS({ isCompression: false });

/*
 * If not building with SSR mode, you can
 * directly export the Store instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Store instance.
 */

interface RootState {
  baseURL: string;
  rootURL: string;
  gtmID: string;
  httpTimeout: number;
  currentYear: number | null;
  message: AlertInterface;
  tokenRefreshTime: number;
}

type HttpOptions = {
  baseURL: string;
  timeout: number;
  headers?: { Authorization: string };
};

interface RootGetterInterface {
  getHttpProtocol: (state: StoreElements) => string;
  getCurrentYear: (state: StoreElements) => number;
  getGtmID: (state: StoreElements) => number;
  getRootURL: (state: StoreElements) => string;
  getBaseURL: (state: StoreElements) => string;
  getHttpTimeout: (state: StoreElements) => number;
  getHttpOptions: (
    state: StoreElements,
    getters: RootGetterInterface
  ) => HttpOptions;
  getHttpNoAuthOptions: (
    state: StoreElements,
    getters: RootGetterInterface
  ) => HttpOptions;
  getMessage: (state: StoreElements) => AlertInterface;
  getTokenRefreshTime: (state: StoreElements) => number;
}

export interface StateInterface {
  menus?: MenusStateInterface;
  auth?: AuthStateInterface;
  customers?: CustomersStateInterface;
}

export interface StoreGettersInterface {
  menus?: MenusGettersInterface;
  auth?: AuthGettersInterface;
  customers?: CustomersGetterInterface;
}

export type StoreGetters = RootGetterInterface & StoreGettersInterface;

interface AlertInterface {
  type: string;
  content: string;
  status: number | null;
  statusText: string;
  activity: string;
}

export type StoreElements = RootState & StateInterface;
export interface StoreInterface {
  strict?: boolean;
  state: RootState;
  modules: StateInterface;
  getters: GetterTree<RootState, StateInterface>;
}

// define your own `useStore` composition function
export function useStore() {
  const key: InjectionKey<Store<StoreElements>> = Symbol('agboho_store_symbol');
  return baseUseStore(key);
}

let store: Store<StoreElements>;

export default function (/* { ssrContext } */) {
  store = createStore<StoreElements>({
    strict: process.env.NODE_ENV !== 'production',
    state: () => ({
      baseURL: `${
        process.env.NODE_ENV === 'production'
          ? 'api.xxx.com/v1'
          : '127.0.0.1:4444/v1'
      }`,
      rootURL: `${
        process.env.NODE_ENV === 'production' ? 'api.xxx.com' : '127.0.0.1:4444'
      }`,
      gtmID: `${process.env.NODE_ENV === 'production' ? '' : ''}`,
      httpTimeout: process.env.NODE_ENV === 'production' ? 60000 : 30000,
      currentYear: null,
      message: {
        type: '',
        content: '',
        status: null,
        statusText: '',
        activity: '',
      },
      tokenRefreshTime: 120,
    }),
    getters: {
      getHttpProtocol() {
        return window.location.hostname === 'localhost' ||
          process.env.NODE_ENV !== 'production'
          ? 'http://'
          : 'https://';
      },
      getCurrentYear: (state) => state.currentYear,
      getGtmID: (state) => state.gtmID,
      getRootURL: (state, getters) => {
        return `${getters.getHttpProtocol as string}${state.rootURL}`;
      },
      getBaseURL: (state, getters) => {
        return `${getters.getHttpProtocol as string}${state.baseURL}`;
      },
      getHttpTimeout: (state) => state.httpTimeout,
      getHttpOptions: (state, getters) => {
        console.log(getters['auth/getToken']);

        return {
          baseURL: getters.getBaseURL as string,
          timeout: getters.getHttpTimeout as number,
          headers: {
            Authorization: `Bearer ${getters['auth/getToken'] as string}`,
          },
        };
      },
      getHttpNoAuthOptions: (state, getters) => {
        return {
          baseURL: getters.getBaseURL as string,
          timeout: getters.getHttpTimeout as string,
        };
      },
      getMessage: (state) => state.message,
      getTokenRefreshTime: (state) => state.tokenRefreshTime,
    },
    modules: {
      menus,
      auth,
      customers,
    },
    plugins:
      process.env.NODE_ENV !== 'production'
        ? [
            createLogger({
              collapsed: false, // auto-expand logged mutations
              logActions: true, // Log Actions
              logMutations: true, // Log mutations
              logger: console, // implementation of the `console` API, default `console`
            }),
            createPersistedState(),
          ]
        : [
            createPersistedState({
              storage: {
                getItem: (key) => ls.get(key),
                setItem: (key, value) => ls.set(key, value),
                removeItem: (key) => ls.remove(key),
              },
            }),
          ],
  });

  return store;
}

export { store };
