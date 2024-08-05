'use client'

import { useActions, useUIState } from 'ai/rsc'

import type { AI } from '@/lib/chat/actions'
import { Badge } from '../ui/badge'
import { Separator } from '../ui/separator'
import { Button } from '../ui/button'
import { Card } from '../ui/card'

interface Project {
    projectName: string
    domain: string
    branch: string
    created: string
    live: boolean
    org: string
    repo: string
    latest: {
        target: string
        message: string
        time: string
    }
}

export function Projects({ props: projects }: { props: Project[] }) {
    const [, setMessages] = useUIState<typeof AI>()
    const { submitUserMessage } = useActions()

    return (
        <div className="mb-4 flex gap-2 overflow-x-auto max-w-2xl text-sm sm:flex-row">
            {projects.map(project => (
                <Card className=" rounded-lg shadow-md p-6 min-w-80">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-white-800">{project.projectName}</h2>
                    </div>
                    <a href={project.domain} className=" mb-6">{project.domain}</a>
                    <div className="flex items-center my-4 gap-2">
                        <ion-icon name="git-branch-outline"></ion-icon>
                        <span className="text-sm ">Created - {new Date(project.created).toLocaleDateString()}</span>
                    </div>
                    {/* //TODO add avatar */}
                    <Badge variant="secondary" className="py-1">
                        <ion-icon name="logo-github"></ion-icon>
                        <p className="mx-2">{project.org}/{project.repo}</p></Badge>
                    <Separator className="my-4" />
                    <h3 className="text-lg font-semibold  mb-3">Latest Deployment</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center">
                                <Badge variant="secondary" className="mr-2">{project.latest?.target}</Badge>
                            </div>
                            <span className="text-sm">{new Date(project.latest?.time).toLocaleString()}</span>
                        </div>
                    </div>
                    <div className="mt-2">
                        <div className="flex items-center gap-2">
                            <ion-icon name="git-commit-outline"></ion-icon>
                            <span className="text-sm ">{project.latest?.message}</span>
                        </div>
                    </div>
                    <Button variant="default" className="w-full mt-6"
                    onClick={async () => {
                        const response = await submitUserMessage(`view project details of the project ${project.projectName}`)
                        setMessages(currentMessages => [...currentMessages, response])
                      }}
                    >
                        {/* <ion-icon name="open-outline" className="mr-2"></ion-icon> */}
                        View details
                    </Button>
                </Card>

            ))}
        </div>
    )
}
