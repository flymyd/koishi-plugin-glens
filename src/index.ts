import {Context, h, Schema} from 'koishi'
// @ts-ignore
import axios from "axios";

export const name = 'glens'

export interface Config {
  endpoint: string,
  supportCrop: boolean
}

export const Config: Schema<Config> = Schema.object({
  endpoint: Schema.string().description("请输入PyGlens服务端地址").required(),
  supportCrop: Schema.boolean().description("是否允许传入裁切参数").default(true),
})

export function apply(ctx: Context, config: Config) {
  ctx.command('谷歌识图', '裁切参数：0/yolo yolov8识别裁切（目标检测） 1 opencv裁切（仅裁黑边，默认） 2/原图 不裁切。对于gif图，请附加参数2或原图。').action(async ({session, options}, ...cntArr) => {
    let quoteMessage: string | h[];
    let imageURL: string | Buffer | URL | ArrayBufferLike;
    let sessionContent: string = session.content;
    let cropType = 2;
    if (config.supportCrop) {
      cropType = 1
      if (cntArr.length > 1) {
        const inputCropType = cntArr[0].trim();
        if (inputCropType === "0" || inputCropType === "yolo") {
          cropType = 0
        } else if (inputCropType === "2" || inputCropType === "原图") {
          cropType = 2
        }
      }
    }
    try {
      quoteMessage = session.quote.content;
      imageURL = h.select(quoteMessage, "img").map((a) => a.attrs.src)[0];
      // console.info("用户触发的内容为  " + cntArr);
      // console.info("用户回复的内容为  " + quoteMessage);
    } catch (e) {
      imageURL = h.select(sessionContent, "img").map((a) => a.attrs.src)[0];
      if (!imageURL) {
        await session.send("请在30s内发送图片");
        let userMessage = await session.prompt(30000);
        // console.info("用户触发的内容为  " + cntArr);
        imageURL = h.select(userMessage, "img").map((a) => a.attrs.src)[0];
      }
    }
    if (!imageURL) {
      return "请使用正确的图片内容";
    }
    const reqData = {'pic_url': imageURL as string, 'crop_type': cropType};
    if (cropType != 2) {
      reqData['need_crop'] = 1;
    }
    const res: any = await axios.post(`${config.endpoint}/glens`, reqData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
    }).catch((err: any) => {
      console.error(err)
      return 114514
    })
    if (res === 114514) {
      return "请求错误，请检查服务端是否正常运行。"
    } else {
      if (res.data.length === 0) {
        return '未识别到任何内容。'
      } else {
        const resp = res.data.map((obj: any, index: number) => {
          return `${index + 1}. ${obj.title} ${obj.url}`
        })
        return '识别结果：\n' + resp.join('\n')
      }
    }
  })
}

export const usage = `
PyGlens项目地址：https://github.com/flymyd/pyglens \n
配合javbus-new插件食用体验更佳 \n
supportCrop 为true时，支持传入裁切参数。默认参数为1 \n
裁切参数：0/yolo yolov8识别裁切（目标检测） 1 opencv裁切（仅裁黑边，默认） 2/原图 不裁切\n
对于gif图，请附加参数2或原图。
`
