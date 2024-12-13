/*
 * @Author: lxj 1851816672@qq.com
 * @Date: 2023-12-24 05:11:34
 * @LastEditors: lxj 1851816672@qq.com
 * @LastEditTime: 2024-05-08 00:20:27
 * @FilePath: /marketPlace/providers/Web3.jsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { useEffect, useState } from "react"
import "@rainbow-me/rainbowkit/styles.css"
import { configureChains, createConfig, WagmiConfig, } from "wagmi"
import { getDefaultWallets, RainbowKitProvider, lightTheme } from "@rainbow-me/rainbowkit"
import {
  mantleTestnet
} from "wagmi/chains"
import { publicProvider } from "wagmi/providers/public"
import merge from "lodash.merge";

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [
    mantleTestnet,
    ...(process.env.NEXT_PUBLIC_ENABLE_TESTNETS === "true" ? [mantleTestnet] : [])
  ],
  [publicProvider()]
)
const { connectors } = getDefaultWallets({
  appName: "Dapp Forge",
  projectId: "928c0944dc8279fb073a7405ecd6b657",
  chains
})

const myTheme = merge(
  lightTheme({
    accentColor: "#3E1089",
    accentColorForeground: "#ffffff",
    borderRadius: "medium",
    fontStack: "system",
    overlayBlur: "small",
  }),
  {
    colors: {
      connectButtonText: "#3E1089",
    },
  }
);

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
  webSocketPublicClient
})

export function Web3Provider(props) {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    setReady(true)
  }, [])
  return (
    <>
      {ready && (
        <WagmiConfig config={wagmiConfig}>
          <RainbowKitProvider chains={chains} theme={myTheme}>
            {props.children}
          </RainbowKitProvider>
        </WagmiConfig>
      )}
    </>
  )
}