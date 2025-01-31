import {
  TEST_NET,
  MAIN_NET,
  MAIN_NET_LIST,
  DEFAULT_SCRYPT
} from './consts'
import axios from 'axios'
import store from '../renderer/store'
import {message} from 'ant-design-vue'
import i18n from '../common/lang'
import {
  BigNumber
} from 'bignumber.js'
import numeral from 'numeral'
import {Crypto, RestClient} from 'ontology-ts-sdk'
const opn = require('opn')
const {
    BrowserWindow
  } = require('electron').remote;

export function open(url) {
  try {
    opn(url)
  } catch(err) {
    let win = new BrowserWindow({width: 800, height: 600, center: true});
    win.on('closed', () => {
      win = null
    })

    // Load a remote URL
    win.loadURL(url)
  }
}
export function varifyPositiveInt(value) {
    if (!/^[1-9]\d*$/.test(value)) {
        return false;
    }
    return true;
}

export function varifyOngValue(value) {
    if (!/^[0-9]+([.]{1}[0-9]{1,9})?$/.test(value)) {
        return false;
    }
    return true;
}

export function isHexString(str) {
    const regexp = /^[0-9a-fA-F]+$/;
    return regexp.test(str) && (str.length % 2 === 0);
}

export function getNodeUrl() {
    // const net = localStorage.getItem('net');
    // return net === 'TEST_NET' ? TEST_NET + ':20334' : MAIN_NET + ':20334'
    // return 'http://139.219.128.220:20334' //for test 
    const node = localStorage.getItem('nodeAddress') || MAIN_NET_LIST[0]
    return node + ':20334';
}

export function getRestClient() {
  let url = getNodeUrl();
  const restClient = new RestClient(url);
  return restClient;
}

export function convertNumber2Str(num, decimal = 0, division) {
    const val = new BigNumber(num).dividedBy(Math.pow(10, decimal))
    if(division) {
      return val.toFixed(8);
    }
    return val.toString();
}

export function convertStr2Number(str, decimal = 0) {
    const val = new BigNumber(num).times(Math.pow(10, decimal))
    return val.toNumber();
}

export function decryptWallet(wallet, password, scrypt = DEFAULT_SCRYPT) {
    const enc = new Crypto.PrivateKey(wallet.key)
    let pri;
    try {
      pri = enc.decrypt(password, new Crypto.Address(wallet.address), wallet.salt, scrypt)
    } catch (err) {
      console.log(err);
      store.dispatch('hideLoadingModals')
      message.error(i18n.t('common.pwdErr'))
      return;
    }
    return pri;
}

export function validateAddress(address) {
  try {
    const addr = new Crypto.Address(address)
    addr.serialize();
    return true;
  }catch(err) {
    return false;
  }
}

export function convertScryptParams({n, r, p, dkLen}) {
  return {
    cost: n,
    blockSize: r,
    parallel: p,
    size: dkLen
  }
}

// 创建axios实例
const service = axios.create({
  timeout: 15000 // 请求超时时间
});

// request拦截器
service.interceptors.request.use(
  config => {
    store.dispatch('showLoadingModals')
    return config;
  },
  error => {
    console.log('e')
    store.dispatch('hideLoadingModals')
    Promise.reject(error);
  }
);
// respone拦截器
service.interceptors.response.use(
  response => {
    store.dispatch('hideLoadingModals')
    const data = response.data;
    return data;
  },
  error => {
    store.dispatch('hideLoadingModals')
    const response = error.response;
    message.error(i18n.t('commonWalletHome.networkError'))
    return Promise.reject((response && response.data) || error);
  }
);

export default service;