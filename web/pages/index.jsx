/*
 * @Author: lxj 1851816672@qq.com
 * @Date: 2024-01-02 22:05:01
 * @LastEditors: lxj 1851816672@qq.com
 * @LastEditTime: 2024-05-24 11:32:26
 * @FilePath: /TheLastOneGame/pages/winner.jsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { ethers } from "ethers"
import { useEffect, useState } from 'react'
import { useContracts } from '@/hooks/useContract';
import { useAccount, useNetwork } from 'wagmi'
import ammABI from 'Abi/amm.json'
import { Input, Modal } from 'antd';
import styles from '@/styles/home.module.css'
import toast from 'react-hot-toast'
import tokenAbi from 'Abi/token.json'
import { convertToWei, weiToEth } from '@/assets/utils'

const Home = () => {
  const { address } = useAccount()
  const [isDisabled, setIsDisabled] = useState(true)
  const [amount, setamount] = useState('')
  const [symbol, setSymbol] = useState('')
  const [OpenModel, setOpenModel] = useState(false);
  const [ModelTitle, setModelTitle] = useState('Deposit ETH');
  const [avaliableNum, setAvaliableNum] = useState(0)
  const { chain } = useNetwork()
  const [TokenAddress, setTokenAddress] = useState('')
  const [step, setStep] = useState(1)
  const [DepositETH, setDepositETH] = useState(0)
  const [StakingAmount, setStakingAmount] = useState(0)
  const [BorrowedAmount, setBorrowedAmount] = useState(0)
  const [BorrowedRate, setBorrowedRate] = useState(0)
  const [TokenPrice, setTokenPrice] = useState(0)
  const [UserDepositETH, setUserDepositETH] = useState(0)
  const [UserStakingAmount, setUserStakingAmount] = useState(0)
  const [UserStakeTokenShare, setUserStakeTokenShare] = useState(0)
  const [UserBorrowedAmount, setUserBorrowedAmount] = useState(0)
  const [UserBorrowedRate, setUserBorrowedRate] = useState(0)
  const [UserTokenPrice, setUserTokenPrice] = useState(0)
  const [ammContract, setAmmContract] = useState('')
  const [ammContractAddress, setAmmContractAddress] = useState('')


  useEffect(() => {
    setAmmContract(useContracts('0xcE06F513bEDc130d1FE12Cb5A3624266CFCDCF66', ammABI))
    setAmmContractAddress('0xcE06F513bEDc130d1FE12Cb5A3624266CFCDCF66')


  }, [chain])

  useEffect(() => {
    if (TokenAddress) {
      getBanlance()
      getData()
    }
  }, [TokenAddress])

  const getBanlance = async () => {
    const tokenContract = useContracts(TokenAddress, tokenAbi)
    let res = await tokenContract.symbol().catch(e => {
      console.log(e);
    })
    setSymbol(res)

  }
  const getData = async () => {
    ammContract.tokenPoolInfo(TokenAddress).then((res) => {
      if (res) {
        setDepositETH(res[0]?.toString())
        setStakingAmount(res[1]?.toString())
        setBorrowedAmount(res[3]?.toString())
        setBorrowedRate(res[3]?.toString() / res[1]?.toString())
        setTokenPrice(res[2]?.toString())
      }
    }).catch(e => {
      console.log(e);
      toast.error('LP not found!')
      setDepositETH(0)
      setStakingAmount(0)
      setBorrowedAmount(0)
      setBorrowedRate(0)
      setTokenPrice(0)
      setUserDepositETH(0)
      setUserStakingAmount(0)
      setUserBorrowedAmount(0)
      setUserBorrowedRate(0)
      setUserTokenPrice(0)
    })


    ammContract.userPositionInfo(address, TokenAddress).then((userRes) => {
      if (userRes) {
        setUserDepositETH(userRes[0]?.toString())
        setUserStakingAmount(userRes[1]?.toString())
        setUserBorrowedAmount(userRes[2]?.toString())
        setUserBorrowedRate(userRes[3]?.toString())
        setUserTokenPrice(userRes[4]?.toString())
      }
    }).catch(e => {
      console.log(e);
      setUserDepositETH(0)
      setUserStakingAmount(0)
      setUserBorrowedAmount(0)
      setUserBorrowedRate(0)
      setUserTokenPrice(0)
    })

    let TokenShare = await ammContract.userStakeTokenShare(address, TokenAddress).catch(e => {
      console.log(e);
      setUserStakeTokenShare(0)
    })
    if (TokenShare) {
      setUserStakeTokenShare(TokenShare?.toString())
      let calShareTokenUnstakeAmount = await ammContract.calShareTokenUnstakeAmount(TokenAddress, TokenShare).catch(e => {
        console.log(e);
        setUserStakingAmount(0)
      })
      if (calShareTokenUnstakeAmount) {
        setUserStakingAmount(calShareTokenUnstakeAmount?.toString())
      }
    }
  }

  const tokenInChange = (e) => {
    setTokenAddress(e.target.value)
  }


  const action = async () => {
    const tokenContract = useContracts(TokenAddress, tokenAbi)

    if (step == 1) {
      const value = ethers.utils.parseEther(amount);
      await ammContract.addEthFund(TokenAddress, { value }).then(res => {
        toast.success('Deposit Successfully!')
        getData()
      }).catch(e => {
        console.log(e);

        toast.error("ERROR!")
      }).catch(e => {
        console.log(e);
      })
    }

    if (step == 2) {
      let banlance = await tokenContract.balanceOf(address).catch(e => {
        console.log(e);
      })
      let avaliableNum = Number(weiToEth(banlance.toString()))
      let res = await tokenContract.allowance(address, ammContractAddress).catch(e => {
        console.log(e);
      })
      let allowanceNum = Number(weiToEth(res.toString()))

      if (avaliableNum == 0 || !avaliableNum || avaliableNum < amount) {

        toast.error('Not enough ' + symbol)
        return
      }

      if (amount > allowanceNum) {
        tokenApprove()
      } else {
        stake()
      }

    }
    if (step == 3) {
      console.log(convertToWei(amount));
      await ammContract.unStakeToken(TokenAddress, convertToWei(amount)).then(res => {
        toast.success('WithDreaw Successfully!')
        getData()
      }).catch(e => {
        console.log(e);
        toast.error("ERROR!")
      }).catch(e => {
        console.log(e);
      })
    }
    if (step == 4) {
      await ammContract.BorrowAsset(TokenAddress, convertToWei(amount)).then(res => {
        toast.success('Borrow Successfully!')
        getData()
      }).catch(e => {
        console.log(e);
        toast.error("ERROR!")
      }).catch(e => {
        console.log(e);
      })
    }
  }

  const stake = async () => {
    await ammContract.stakeToken(TokenAddress, convertToWei(amount)).then(res => {
      toast.success('Stake Successfully!')
      getData()
    }).catch(e => {
      console.log(e);
      toast.error("ERROR!")
    }).catch(e => {
      console.log(e);
    })
  }

  const handleCancelTokenIn = () => {
    setOpenModel(false);
  }

  const amountChange = (e) => {
    setamount(e.target.value)
  }

  const openModel = (title, step) => {
    if (!TokenAddress) {
      toast.error("Please input TokenAddress!")
      return
    }
    setamount('')
    setStep(step)
    setModelTitle(title)
    setOpenModel(true)
  }

  const modelHandle = async () => {
    if (address === undefined) {
      toast.error("Please connect wallet first!")
      return
    }

    if (!amount) {
      toast.error("Please input amount!")
    }
    action()

  }

  const tokenApprove = async () => {
    const tokenContract = useContracts(TokenAddress, tokenAbi)
    const maxValue = ethers.constants.MaxUint256;
    await tokenContract.approve(ammContractAddress, maxValue).then(res => {
      stake()
    }).catch(e => {
      console.log('bv', e);
    })
  }

  const repay = async () => {
    console.log(TokenAddress);

    await ammContract.repayAllToken(TokenAddress).then(res => {
      toast.success('Borrow Successfully!')
      getData()
    }).catch(e => {
      console.log(e);
      toast.error("ERROR!")
    }).catch(e => {
      console.log(e);
    })

  }


  return (
    <div className={styles.outBox}>
      <div className={styles.cardBox}>
        <div className={styles.title}>Search Information</div>
        <div className={styles.formOutItem} >
          <div className={styles.tokenAress}>Token Adress:</div>
          <Input className={styles.customTokenInput} value={TokenAddress} onChange={tokenInChange} />
        </div>
        <div className={styles.requestBtnOutBox}>
          <button className={styles.requestBtn} disabled={(TokenAddress === '0x' || '') || !address} onClick={getData}>{!address ? 'Connect wallet' : !TokenAddress ? 'Input token adress' : 'Search'}</button>
        </div>
        <div className={styles.title}>Token Pool Information</div>
        <div className={styles.informationBox}>
          <div className={styles.subCard}>
            <div className={styles.formOutItem}>
              <div>ETH Pool Amount</div>
              <div className={styles.ModelnumOut}>{weiToEth(DepositETH)} ETH</div>
            </div>
            <div className={styles.formOutItem}>
              <div>Staking Amount</div>
              <div className={styles.ModelnumOut}>{weiToEth(StakingAmount)} {symbol}</div>
            </div>
            <div className={styles.formOutItem}>
              <div>Borrowed Amount</div>
              <div className={styles.ModelnumOut}>{weiToEth(BorrowedAmount)} {symbol}</div>
            </div>
            <div className={styles.formOutItem}>
              <div>Borrowed Rate</div>
              <div className={styles.ModelnumOut}>{Number(BorrowedRate).toFixed(6)} %</div>
            </div>
            <div className={styles.formOutItem}>
              <div>Token Price</div>
              <div className={styles.ModelnumOut}>{weiToEth(TokenPrice).toFixed(6)} ETH</div>
            </div>
          </div>
          <div className={styles.subCard}>
            <div className={styles.formOutItem}>
              <div className='myButton' onClick={() => { openModel('Deposit', 1) }}>Deposit ETH</div>
            </div>
            <div className={styles.formOutItem}>
              <div className='myButton' onClick={() => { openModel('Stake', 2) }}>Stake token</div>
              <div className='myButton' onClick={() => { openModel('Withdraw', 3) }}>Withdraw token</div>
            </div>
            <div className={styles.formOutItem}>
              <div className='myButton' onClick={() => { openModel('Borrow', 4) }}>Borrow token</div>
            </div>
            <div className={styles.formOutItem}>
              <div className='myButton' onClick={() => { repay() }}>Repay All token</div>
            </div>
          </div>
        </div>
        <div className={styles.title}>User Asset Information</div>
        <div className={styles.informationBox}>
          <div className={styles.subCard} >
            <div className={styles.formOutItem}>
              <div>ETH Banlance</div>
              <div className={styles.ModelnumOut}>{weiToEth(UserDepositETH)} ETH</div>
            </div>
            <div className={styles.formOutItem} style={{ width: '500px' }}>
              <div>User Stake Token Share</div>
              <div className={styles.ModelnumOut}>{weiToEth(UserStakeTokenShare)}</div>
            </div>
            <div className={styles.formOutItem}>
              <div>Staking Amount</div>
              <div className={styles.ModelnumOut}>{weiToEth(UserStakingAmount).toFixed(6)} {symbol}</div>
            </div>
            <div className={styles.formOutItem}>
              <div>Borrowed Amount</div>
              <div className={styles.ModelnumOut}>{weiToEth(UserBorrowedAmount).toFixed(6)} {symbol}</div>
            </div>
            <div className={styles.formOutItem}>
              <div>Healthy Factor</div>
              <div className={styles.ModelnumOut}>{Number(UserBorrowedRate).toFixed(6)}%</div>
            </div>
            <div className={styles.formOutItem}>
              <div>Liquidated Price</div>
              <div className={styles.ModelnumOut}>{weiToEth(UserTokenPrice).toFixed(6)} ETH</div>
            </div>
          </div>
        </div>
      </div>
      <Modal
        open={OpenModel}
        title={ModelTitle}
        onCancel={handleCancelTokenIn}
        footer={[

        ]}
      >
        <div className={styles.xbody}>
          <div className={styles.formOutItem}>
            <div className={styles.amount}>{step == 2 ? 'Token Share' : 'Amount:'}</div>
            <Input className={styles.customTokenInput} value={amount} onChange={amountChange} />
          </div>
        </div>
        <div className='flex justify-end mt-8'>
          <div className={`myButton`} onClick={modelHandle}>{ModelTitle}</div>
        </div>
      </Modal>
    </div >
  )
}

export default Home