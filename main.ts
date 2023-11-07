let Counter2 = 0
let Base_frequency = 0
let ch_num = 0
let TX_Power_data = 0
let o = 0
let CheckSum = 0
let ch_spacing = 0
let Para_array: number[] = []
namespace ZETag {
    //% blockId=Channel_Spacing block="ZETag Set Channel Space %text"
    //% CH_Space.min=100 CH_Space.max=200 CH_Space.defl=100
    export function Set_channel_spacing(CH_space: number) {
        if (CH_space > 200) {
            ch_spacing = 200
        } else {
            ch_spacing = CH_space
        }
        // FF 00 03 F0 64 56; 100KHz設定
        // FF+00+03+F0=1F2=498(10)
        Send_Uart_data([
            255,
            0,
            3,
            240,
            ch_spacing,
            (498 + ch_spacing) % 256
        ], 6)
    }

    //% blockId=Send_data block="ZETag Send data %text %text"
    export function Send_data(list: number[], e_num: number) {
        // 255+2+128=385
        // FF 00 02 80
        CheckSum = 385 + e_num
        Send_Uart_data([
            255,
            0,
            e_num + 2,
            128
        ], 4)
        o = 0
        for (let index = 0; index < e_num; index++) {
            bserial.binserial_write(list[o])
            basic.pause(5)
            CheckSum = CheckSum + list[o]
            o += 1
        }
        bserial.binserial_write(CheckSum % 256)
        basic.pause(5)
    }

    //% blockId=TX_Power block="ZETag TX Power %text"
    export function Set_TX_Power(TX_Power: number) {
        if (TX_Power > 10) {
            TX_Power_data = 20
        } else {
            TX_Power_data = TX_Power * 2
        }
        // FF 00 03 41 10 53; 出力8dB設定
        // FF+00+03+41=143=323(10)
        Send_Uart_data([
            255,
            0,
            3,
            65,
            TX_Power_data,
            (323 + TX_Power_data) % 256
        ], 6)
    }

    export function Send_Uart_data(list: number[], e_num: number) {
        o = 0
        for (let n = 0; n <= e_num - 1; n++) {
            bserial.binserial_write(list[n])
            basic.pause(5)
        }
    }

    //% blockId=Set_Frequency block="ZETag Set Frequency %text %text %text"
    export function Set_Frequency(Frequency: number, CH_num: number, step: number) {
        if (step == 0) {
            o = 1
        } else if (step >= 2) {
            o = 2
        } else {
            o = step
        }
        if (CH_num <= 1) {
            ch_num = -1
        } else if (CH_num > 6) {
            ch_num = 6
        } else {
            ch_num = CH_num
        }
        Base_frequency = Frequency
        CheckSum = 0
        Para_array = [
            255,
            0,
            8 + ch_num,
            64,
            1,
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
    }
}
