import {Context, h, Schema} from 'koishi'
// @ts-ignore
import axios from "axios";

export const name = 'glens'

export interface Config {
  endpoint: string
}

export const Config: Schema<Config> = Schema.object({
  endpoint: Schema.string().description("请输入PyGlens服务端地址").required(),
})

export function apply(ctx: Context, config: Config) {
  ctx.command('谷歌识图').action(async ({session, options}, ...cntArr) => {
    let quoteMessage: string | h[];
    let imageURL: string | Buffer | URL | ArrayBufferLike;
    let sessionContent: string = session.content;
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
    const res: any = await axios.post(`${config.endpoint}/glens`, {'pic_url': imageURL as string}, {
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
配合javbus-new插件食用体验更佳
`
