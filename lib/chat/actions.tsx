import 'server-only'

import {
  createAI,
  createStreamableUI,
  getMutableAIState,
  getAIState,
  streamUI,
  createStreamableValue
} from 'ai/rsc'
import { createAzure } from '@ai-sdk/azure'

import {
  spinner,
  BotCard,
  BotMessage,
  SystemMessage,
  Stock,
  Stocks,
  Purchase
} from '@/components/stocks'

import { z } from 'zod'
import { EventsSkeleton } from '@/components/stocks/events-skeleton'
import { Events } from '@/components/stocks/events'
import { StocksSkeleton } from '@/components/stocks/stocks-skeleton'
import {  } from '@/components/stocks/stocks'
import { StockSkeleton } from '@/components/stocks/stock-skeleton'
import {
  formatNumber,
  runAsyncFnWithoutBlocking,
  sleep,
  nanoid
} from '@/lib/utils'
import { saveChat } from '@/app/actions'
import { SpinnerMessage, UserMessage } from '@/components/stocks/message'
import { Chat, Message } from '@/lib/types'
import { auth } from '@/auth'
import { createVertex, vertex } from '@ai-sdk/google-vertex'
import { Projects } from '@/components/projects/projects'
import { Project } from '@/components/projects/project'

async function confirmPurchase(symbol: string, price: number, amount: number) {
  'use server'

  const aiState = getMutableAIState<typeof AI>()

  const purchasing = createStreamableUI(
    <div className="inline-flex items-start gap-1 md:items-center">
      {spinner}
      <p className="mb-2">
        Purchasing {amount} ${symbol}...
      </p>
    </div>
  )

  const systemMessage = createStreamableUI(null)

  runAsyncFnWithoutBlocking(async () => {
    await sleep(1000)

    purchasing.update(
      <div className="inline-flex items-start gap-1 md:items-center">
        {spinner}
        <p className="mb-2">
          Purchasing {amount} ${symbol}... working on it...
        </p>
      </div>
    )

    await sleep(1000)

    purchasing.done(
      <div>
        <p className="mb-2">
          You have successfully purchased {amount} ${symbol}. Total cost:{' '}
          {formatNumber(amount * price)}
        </p>
      </div>
    )

    systemMessage.done(
      <SystemMessage>
        You have purchased {amount} shares of {symbol} at ${price}. Total cost ={' '}
        {formatNumber(amount * price)}.
      </SystemMessage>
    )

    aiState.done({
      ...aiState.get(),
      messages: [
        ...aiState.get().messages,
        {
          id: nanoid(),
          role: 'system',
          content: `[User has purchased ${amount} shares of ${symbol} at ${price}. Total cost = ${
            amount * price
          }]`
        }
      ]
    })
  })

  return {
    purchasingUI: purchasing.value,
    newMessage: {
      id: nanoid(),
      display: systemMessage.value
    }
  }
}

async function submitUserMessage(content: string) {
  'use server'

  const aiState = getMutableAIState<typeof AI>()

  aiState.update({
    ...aiState.get(),
    messages: [
      ...aiState.get().messages,
      {
        id: nanoid(),
        role: 'user',
        content
      }
    ]
  })

  let textStream: undefined | ReturnType<typeof createStreamableValue<string>>
  let textNode: undefined | React.ReactNode

  const result = await streamUI({
    model: vertex("gemini-1.5-pro"), 
    initial: <SpinnerMessage />,
    system: `\
    You are a Vercel API conversation bot and you can help users interact with Vercel's REST API, step by step.
    You and the user can discuss various API functionalities and the user can adjust parameters or make requests through the UI.

    Messages inside [] mean that it's a UI element or a user event. For example:
    - "[User has set project ID to xyz123]" means that the user has set the project ID to xyz123 in the UI.
    - "[User has changed deployment URL to https://example.com]" means that the user has changed the deployment URL in the UI.

    If the user wants to list projects, call \`listProjects\` endpoint.
    If the user wants to view a project details using a project name, call \`viewProject\` endpoint.
    If the user wants to create a new project, call \`createProject\` endpoint.
    If the user requests information about a project, call \`getProject\` endpoint.
    If the user wants to create a new deployment, call \`createDeployment\` endpoint.
    If the user wants to list deployments, call \`listDeployments\` endpoint.
    If the user wants to delete a deployment, call \`deleteDeployment\` endpoint.
    If the user wants to get usage statistics, call \`getUsage\` endpoint.
    If the user wants to list domains, call \`listDomains\` endpoint.
    If the user wants to create a new domain, call \`createDomain\` endpoint.
    If the user wants to delete a domain, call \`deleteDomain\` endpoint.

    If the user requests a functionality not supported by the current API, respond that you are a demo and cannot perform that action.

    Besides that, you can also chat with users and do some calculations if needed.`,
    messages: [
      ...aiState.get().messages.map((message: any) => ({
        role: message.role,
        content: message.content,
        name: message.name
      }))
    ],
    text: ({ content, done, delta }) => {
      if (!textStream) {
        textStream = createStreamableValue('')
        textNode = <BotMessage content={textStream.value} />
      }

      if (done) {
        textStream.done()
        aiState.done({
          ...aiState.get(),
          messages: [
            ...aiState.get().messages,
            {
              id: nanoid(),
              role: 'assistant',
              content
            }
          ]
        })
      } else {
        textStream.update(delta)
      }

      return textNode
    },
    tools: {
      //Listproject is a tool that lists all the projects of vercel dashboard using the endpoint https://api.vercel.com/v9/projects?deprecated=true&edgeConfigId=SOME_STRING_VALUE&edgeConfigTokenId=SOME_STRING_VALUE&excludeRepos=SOME_STRING_VALUE&from=SOME_STRING_VALUE&gitForkProtection=1&limit=SOME_STRING_VALUE&repo=SOME_STRING_VALUE&repoId=SOME_STRING_VALUE&repoUrl=https://github.com/vercel/next.js&search=SOME_STRING_VALUE&slug=SOME_STRING_VALUE&teamId=SOME_STRING_VALUE"
      listProjects:{
        description: 'List all the projects of vercel dashboard.',
        parameters: z.object({
        }),
        generate: async function* () {
          yield (
            <BotCard>
              <StockSkeleton />
            </BotCard>
          )

          await sleep(1000)          

          const {projects} = await fetch("https://api.vercel.com/v9/projects", {
            "headers": {
              "Authorization": `Bearer ${process.env.VERCEL_API_KEY}`,
            },
            "method": "get"
          }).then(res => res.json())

          const filter = projects.map((project: any) => ({
            projectName: project.name,
            domain: project.latestDeployments[0].alias[0],
            branch: project.link.productionBranch,
            created: project.createdAt,
            live: project.live,
            org: project.link.org,
            repo: project.link.repo,
            latest: {
              target: project.latestDeployments[0].target,
              message: project.latestDeployments[0].meta.githubCommitMessage,
              time: project.latestDeployments[0].createdAt
            }
          }))

          const filteredProjects = filter.filter((project: any) => !project.projectName.includes('backend'))
          
          const toolCallId = nanoid()

          return (
            <BotCard>
              <Projects props={filteredProjects} />
            </BotCard>
          )
        }
      },
      viewProject:{
        description: 'View a project using the project name.',
        parameters: z.object({
          projectName: z.string().describe('The name of the project to view.')
        }),
        generate: async function* ({ projectName }) {
          console.log("here", projectName);
          
          const toolCallId = nanoid()

          const response = await fetch(`https://api.vercel.com/v9/projects/${projectName}`, {
            "headers": {
              "Authorization": `Bearer ${process.env.VERCEL_API_KEY}`,
            },
            "method": "get"
          }).then(res => res.json())

          interface target {
            domains: string[]
            build: string
            git: {
                author: string
                sha: string
                branch: string
                message: string
            }
        }

        console.log(response);

          const production = response.targets?.production ? 
            {
              domains: response.targets.production.alias,
              build: response.targets.production.build,
              git: {
                author: response.targets.production.meta.githubCommitAuthorName,
                sha: response.targets.production.meta.githubCommitSha,
                branch: response.targets.production.meta.githubCommitRef,
                message: response.targets.production.meta.githubCommitMessage
              }
            }
          :{}

          const preview = response.targets?.preview ? 
            {
              domains: response.targets.preview.alias,
              build: response.targets.preview.build,
              git: {
                author: response.targets.preview.meta.githubCommitAuthorName,
                sha: response.targets.preview.meta.githubCommitSha,
                branch: response.targets.preview.meta.githubCommitRef,
                message: response.targets.preview.meta.githubCommitMessage
              }
            }
          :{}

          console.log(production);
          

          const project = {
            projectName: response.name,
            nodeVersion: response.nodeVersion,
            live: response.live,
            private: response.latestDeployments[0].private,
            plan: response.latestDeployments[0].plan,
            host: response.link.type,
            branch: response.link.productionBranch,
            created: response.createdAt,
            updated: response.updatedAt,
            org: response.link.org,
            repo: response.link.repo,
            target:{
                production,
                preview,
            }
          }

          return (
            <BotCard>
              <Project props={project} />
            </BotCard>
          )
        }
      },
      listStocks: {
        description: 'List three imaginary stocks that are trending.',
        parameters: z.object({
          stocks: z.array(
            z.object({
              symbol: z.string().describe('The symbol of the stock'),
              price: z.number().describe('The price of the stock'),
              delta: z.number().describe('The change in price of the stock')
            })
          )
        }),
        generate: async function* ({ stocks }) {
          yield (
            <BotCard>
              <StocksSkeleton />
            </BotCard>
          )

          await sleep(1000)

          const toolCallId = nanoid()

          aiState.done({
            ...aiState.get(),
            messages: [
              ...aiState.get().messages,
              {
                id: nanoid(),
                role: 'assistant',
                content: [
                  {
                    type: 'tool-call',
                    toolName: 'listStocks',
                    toolCallId,
                    args: { stocks }
                  }
                ]
              },
              {
                id: nanoid(),
                role: 'tool',
                content: [
                  {
                    type: 'tool-result',
                    toolName: 'listStocks',
                    toolCallId,
                    result: stocks
                  }
                ]
              }
            ]
          })

          return (
            <BotCard>
              <Stocks props={stocks} />
            </BotCard>
          )
        }
      },
      showStockPrice: {
        description:
          'Get the current stock price of a given stock or currency. Use this to show the price to the user.',
        parameters: z.object({
          symbol: z
            .string()
            .describe(
              'The name or symbol of the stock or currency. e.g. DOGE/AAPL/USD.'
            ),
          price: z.number().describe('The price of the stock.'),
          delta: z.number().describe('The change in price of the stock')
        }),
        generate: async function* ({ symbol, price, delta }) {
          yield (
            <BotCard>
              <StockSkeleton />
            </BotCard>
          )

          await sleep(1000)

          const toolCallId = nanoid()

          aiState.done({
            ...aiState.get(),
            messages: [
              ...aiState.get().messages,
              {
                id: nanoid(),
                role: 'assistant',
                content: [
                  {
                    type: 'tool-call',
                    toolName: 'showStockPrice',
                    toolCallId,
                    args: { symbol, price, delta }
                  }
                ]
              },
              {
                id: nanoid(),
                role: 'tool',
                content: [
                  {
                    type: 'tool-result',
                    toolName: 'showStockPrice',
                    toolCallId,
                    result: { symbol, price, delta }
                  }
                ]
              }
            ]
          })

          return (
            <BotCard>
              <Stock props={{ symbol, price, delta }} />
            </BotCard>
          )
        }
      },
      showStockPurchase: {
        description:
          'Show price and the UI to purchase a stock or currency. Use this if the user wants to purchase a stock or currency.',
        parameters: z.object({
          symbol: z
            .string()
            .describe(
              'The name or symbol of the stock or currency. e.g. DOGE/AAPL/USD.'
            ),
          price: z.number().describe('The price of the stock mentioned by the user in the prompt.'),
          numberOfShares: z
            .number()
            .optional()
            .describe(
              'The **number of shares** for a stock or currency to purchase. Can be optional if the user did not specify it.'
            )
        }),
        generate: async function* ({ symbol, price, numberOfShares = 100 }) {
          const toolCallId = nanoid()

          if (numberOfShares <= 0 || numberOfShares > 1000) {
            aiState.done({
              ...aiState.get(),
              messages: [
                ...aiState.get().messages,
                {
                  id: nanoid(),
                  role: 'assistant',
                  content: [
                    {
                      type: 'tool-call',
                      toolName: 'showStockPurchase',
                      toolCallId,
                      args: { symbol, price, numberOfShares }
                    }
                  ]
                },
                {
                  id: nanoid(),
                  role: 'tool',
                  content: [
                    {
                      type: 'tool-result',
                      toolName: 'showStockPurchase',
                      toolCallId,
                      result: {
                        symbol,
                        price,
                        numberOfShares,
                        status: 'expired'
                      }
                    }
                  ]
                },
                {
                  id: nanoid(),
                  role: 'system',
                  content: `[User has selected an invalid amount]`
                }
              ]
            })

            return <BotMessage content={'Invalid amount'} />
          } else {
            aiState.done({
              ...aiState.get(),
              messages: [
                ...aiState.get().messages,
                {
                  id: nanoid(),
                  role: 'assistant',
                  content: [
                    {
                      type: 'tool-call',
                      toolName: 'showStockPurchase',
                      toolCallId,
                      args: { symbol, price, numberOfShares }
                    }
                  ]
                },
                {
                  id: nanoid(),
                  role: 'tool',
                  content: [
                    {
                      type: 'tool-result',
                      toolName: 'showStockPurchase',
                      toolCallId,
                      result: {
                        symbol,
                        price,
                        numberOfShares
                      }
                    }
                  ]
                }
              ]
            })

            return (
              <BotCard>
                <Purchase
                  props={{
                    numberOfShares,
                    symbol,
                    price: +price,
                    status: 'requires_action'
                  }}
                />
              </BotCard>
            )
          }
        }
      },
      getEvents: {
        description:
          'List funny imaginary events between user highlighted dates that describe stock activity.',
        parameters: z.object({
          events: z.array(
            z.object({
              date: z
                .string()
                .describe('The date of the event, in ISO-8601 format'),
              headline: z.string().describe('The headline of the event'),
              description: z.string().describe('The description of the event')
            })
          )
        }),
        generate: async function* ({ events }) {
          yield (
            <BotCard>
              <EventsSkeleton />
            </BotCard>
          )

          await sleep(1000)

          const toolCallId = nanoid()

          aiState.done({
            ...aiState.get(),
            messages: [
              ...aiState.get().messages,
              {
                id: nanoid(),
                role: 'assistant',
                content: [
                  {
                    type: 'tool-call',
                    toolName: 'getEvents',
                    toolCallId,
                    args: { events }
                  }
                ]
              },
              {
                id: nanoid(),
                role: 'tool',
                content: [
                  {
                    type: 'tool-result',
                    toolName: 'getEvents',
                    toolCallId,
                    result: events
                  }
                ]
              }
            ]
          })

          return (
            <BotCard>
              <Events props={events} />
            </BotCard>
          )
        }
      }
    }
  })

  return {
    id: nanoid(),
    display: result.value
  }
}

export type AIState = {
  chatId: string
  messages: Message[]
}

export type UIState = {
  id: string
  display: React.ReactNode
}[]

export const AI = createAI<AIState, UIState>({
  actions: {
    submitUserMessage,
    confirmPurchase
  },
  initialUIState: [],
  initialAIState: { chatId: nanoid(), messages: [] },
  onGetUIState: async () => {
    'use server'

    const session = await auth()

    if (session && session.user) {
      const aiState = getAIState() as Chat

      if (aiState) {
        const uiState = getUIStateFromAIState(aiState)
        return uiState
      }
    } else {
      return
    }
  },
  onSetAIState: async ({ state }) => {
    'use server'

    const session = await auth()

    if (session && session.user) {
      const { chatId, messages } = state

      const createdAt = new Date()
      const userId = session.user.id as string
      const path = `/chat/${chatId}`

      const firstMessageContent = messages[0].content as string
      const title = firstMessageContent.substring(0, 100)

      const chat: Chat = {
        id: chatId,
        title,
        userId,
        createdAt,
        messages,
        path
      }

      await saveChat(chat)
    } else {
      return
    }
  }
})

export const getUIStateFromAIState = (aiState: Chat) => {
  return aiState.messages
    .filter(message => message.role !== 'system')
    .map((message, index) => ({
      id: `${aiState.chatId}-${index}`,
      display:
        message.role === 'tool' ? (
          message.content.map(tool => {
            return tool.toolName === 'listStocks' ? (
              <BotCard>
                {/* TODO: Infer types based on the tool result*/}
                {/* @ts-expect-error */}
                <Stocks props={tool.result} />
              </BotCard>
            ) : tool.toolName === 'showStockPrice' ? (
              <BotCard>
                {/* @ts-expect-error */}
                <Stock props={tool.result} />
              </BotCard>
            ) : tool.toolName === 'showStockPurchase' ? (
              <BotCard>
                {/* @ts-expect-error */}
                <Purchase props={tool.result} />
              </BotCard>
            ) : tool.toolName === 'getEvents' ? (
              <BotCard>
                {/* @ts-expect-error */}
                <Events props={tool.result} />
              </BotCard>
            ) : null
          })
        ) : message.role === 'user' ? (
          <UserMessage>{message.content as string}</UserMessage>
        ) : message.role === 'assistant' &&
          typeof message.content === 'string' ? (
          <BotMessage content={message.content} />
        ) : null
    }))
}
