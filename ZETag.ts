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
    function Send_Uart_data(data_array: number[], num: number): void {
        for (let i = 0; i < num; i++) {
            bserial.binserial_write(data_array[i])
            basic.pause(5)
        }
    }

    //% blockId=Channel_Spacing block="Set Channel Space %s (KHz)"
    //% weight=80 blockGap=8

    /** set channel spacing */
    //% CH_SPACE.min=100 CH_SPACE.max=250 CH_SPACE.defl=100
    export function Set_channel_spacing(CH_SPACE: number) {
        // FF 00 03 F0 64 56; 100KHz設定 FF+00+03+F0=1F2 -> 0xf2
        if (CH_SPACE <= 100) {
            CH_SPACE = 100
        } else if (CH_SPACE >= 250) {
            CH_SPACE = 250
        }
        Send_Uart_data([0xff, 0x00, 0x03, 0xf0, CH_SPACE, (CH_SPACE + 0xf2) & 0xff], 6)
        basic.pause(100)    /* May modify later */
    }

    //% blockId=Send_data block="Send ZETag data %data_array %num"
    //% weight=80 blockGap=8
    export function Send_data(data_array: number[], num: number) {
        if (num == 0) {
            return
        }
        if (num > 30) {
            num = 30
        }
        // 0xff+2+0x80=0x181 -> 0x81  FF 00 02 80 xx xx xx 
        let CheckSum = num + 0x81
        Send_Uart_data([0xff, 0x00, num + 2, 0x80], 4)
        for (let i = 0; i < num; i++) {
            bserial.binserial_write(data_array[i])
            basic.pause(5)
            CheckSum += data_array[i]
        }
        bserial.binserial_write(CheckSum & 0xff)
        basic.pause(100)    /* May modify later */
    }

    //% blockId=TX_Power block="TX Power %TX_Power (dB)"
    //% TX_Power.min=1 TX_Power.max=10 TX_Power.defl=10
    export function Set_TX_Power(TX_Power: number) {
        if (TX_Power == 0) TX_Power = 1;
        else if (TX_Power >= 10) TX_Power = 10;

        TX_Power *= 2
        // FF 00 03 41 10 53; 出力8dB設定 FF+00+03+41=0x143 -> 0x43
        Send_Uart_data([0xff, 0x00, 0x03, 0x41, TX_Power, (TX_Power + 0x43) & 0xff], 6)
        basic.pause(100)    /* May modify later */
    }

    //% blockId=Set_Frequency block="Set Frequency %Frequency (Hz) %CH_num (ch) %CH_step"
    //% CH_num.min=1 CH_num.max=6 CH_num.defl=2
    //% CH_step.min=1 CH_step.max=2 CH_step.defl=2
    export function Set_Frequency(Frequency: number, CH_num: number, CH_step: number) {
        if (CH_num <= 1) CH_num = -1;
        else if (CH_num >= 6) CH_num = 6;

        if (CH_step == 0) CH_step = 1;
        else if (CH_step >= 2) CH_step = 2;

        if (Frequency < 470000000) Frequency = 470000000;
        else if (Frequency > 928000000) Frequency = 928000000;
        else if ((Frequency > 510000000) && (Frequency < 920600000)) Frequency = 510000000;

        let CheckSum = 0
        let Array = [0xff, 0x00, CH_num + 8, 0x40, 0x01,
            (Frequency >> 24) & 0xff,
            (Frequency >> 16) & 0xff,
            (Frequency >> 8) & 0xff,
            Frequency & 0xff,
            CH_num, 0, 0, 0, 0, 0, 0, 0]

        if (CH_num >= 2) {
            for (let i = 0; i <= CH_num - 1; i++) {
                Array[i + 10] = i * CH_step
            }
        } else {
            Array[4] = 0
        }
        CH_num += 10
        for (let i = 0; i < CH_num; i++) {
            CheckSum = CheckSum + Array[i]
        }
        Array[CH_num] = CheckSum & 0xff
        Send_Uart_data(Array, CH_num + 1)
        basic.pause(100)    /* May modify later */
    }
}