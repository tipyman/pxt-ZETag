/**
 * makecode ZETag module Package.
 * By 2023 Socionext Inc. and ZETA alliance Japan
 * Written by M.Urade　2023/11/8
 */

/**
 * ZETag block
 */
//% weight=100 color=190 icon="\uf482" block="ZETag"
namespace ZETag {
    let Para_array: number[] = []
    let ch_spacing = 0
    let CheckSum = 0
    let o = 0
    let TX_Power_data = 0
    let ch_num = 0
    let Base_frequency = 0
    let Counter2 = 0

    function Send_Uart_data(data_array: number[], num: number): void {
        o = 0
        for (let n = 0; n <= num - 1; n++) {
            bserial.binserial_write(data_array[n])
            basic.pause(5)
        }
    }

    /**
     * set channel spacing
     */
    //% blockId=Channel_Spacing block="Set Channel Space %s (KHz)"
    //% weight=80 blockGap=8
    //% CH_SPACE.min=100 CH_SPACE.max=200 CH_SPACE.defl=100
    export function Set_channel_spacing(CH_SPACE: number) {
        // FF 00 03 F0 64 56; 100KHz設定
        // FF+00+03+F0=1F2 -> 0xf2
        Send_Uart_data([
            0xff,
            0x00,
            0x03,
            0xf0,
            CH_SPACE,
            (0xf2 + CH_SPACE) % 256
        ], 6)
        basic.pause(100)
    }

    //% blockId=Send_data block="Send ZETag data %data_array %num"
    //% weight=80 blockGap=8
    export function Send_data(data_array: number[], num: number) {
        // 0xff+2+0x80=0x181 -> 0x81
        // FF 00 02 80
        CheckSum = 0x81 + num
        Send_Uart_data([
            0xff,
            0x00,
            num + 2,
            0x80
        ], 4)
        o = 0
        for (let index = 0; index < num; index++) {
            bserial.binserial_write(data_array[o])
            basic.pause(5)
            CheckSum = CheckSum + data_array[o]
            o += 1
        }
        bserial.binserial_write(CheckSum % 256)
        basic.pause(100)
    }

    //% blockId=TX_Power block="TX Power %TX_Power (dB)"
    //% weight=80 blockGap=8
    //% TX_Power.min=1 TX_Power.max=10 TX_Power.defl=10
    export function Set_TX_Power(TX_Power: number) {
        TX_Power_data = TX_Power * 2
        // FF 00 03 41 10 53; 出力8dB設定
        // FF+00+03+41=0x143 -> 0x43
        Send_Uart_data([
            0xff,
            0x00,
            0x03,
            0x41,
            TX_Power_data,
            (0x43 + TX_Power_data) % 256
        ], 6)
        basic.pause(100)
    }

    //% blockId=Set_Frequency block="Set Frequency %Frequency (Hz) %CH_num (ch) %CH_step"
    //% weight=80 blockGap=8
    //% CH_num.min=1 CH_num.max=6 CH_num.defl=2
    //% CH_step.min=1 CH_step.max=2 CH_step.defl=2
    export function Set_Frequency(Frequency: number, CH_num: number, CH_step: number) {
        o = CH_step
        if (CH_num <= 1) {
            ch_num = -1
        } else {
            ch_num = CH_num
        }
        Base_frequency = Frequency
        CheckSum = 0
        Para_array = [
            0xff,
            0x00,
            0x08 + ch_num,
            0x40,
            0x01,
            Math.idiv(Base_frequency, 16777216),
            Math.idiv(Base_frequency, 65536) % 256,
            Math.idiv(Base_frequency, 256) % 256,
            Base_frequency % 256,
            ch_num,
            0,
            0,
            0,
            0,
            0,
            0,
            0
        ]
        if (ch_num >= 2) {
            for (let Counter = 0; Counter <= ch_num - 1; Counter++) {
                Para_array[10 + Counter] = Counter * o
            }
        } else {
            Para_array[4] = 0
        }
        Counter2 = 0
        for (let index2 = 0; index2 < ch_num + 10; index2++) {
            CheckSum = CheckSum + Para_array[Counter2]
            Counter2 += 1
        }
        CheckSum = CheckSum % 256
        Para_array[10 + ch_num] = CheckSum
        Send_Uart_data(Para_array, 11 + ch_num)
        basic.pause(100)
    }
}
