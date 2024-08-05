import { ChevronDown } from "lucide-react"
import { Badge } from "../ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible"
import { Separator } from "../ui/separator"
import { Tabs, TabsList, TabsContent, TabsTrigger } from "../ui/tabs"

interface Target {
    domains: string[]
    build: string
    git: {
        author: string
        sha: string
        branch: string
        message: string
    }
}

interface Project {
    projectName: string
    nodeVersion: string
    live: boolean
    private: boolean
    host: string
    branch: string
    created: string
    updated: string
    plan: string
    org: string
    repo: string
    target: {
        production: Target | Record<string, never>
        preview: Target | Record<string, never>
    }
}

export function Project({ props: project }: { props: Project }) {

    console.log(project.target)
    return (
        <Card className="max-w-3xl mx-auto bg-neutral-50 shadow-lg rounded-xl overflow-hidden">
            <CardHeader className="bg-neutral-100 p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <ion-icon name={`logo-${project.host}`} class="text-3xl text-neutral-700"></ion-icon>
                        <div>
                            <CardTitle className="text-2xl font-bold text-neutral-800">{project.projectName}</CardTitle>
                            <CardDescription className="text-sm text-neutral-500">
                            {project.org}/{project.repo}
                            </CardDescription>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">{project.plan}</Badge>
                        <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">{!project.live&&"Not "}Live</Badge>
                        <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-300">{project.private?"Private":"Public"}</Badge>
                        <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">Node {project.nodeVersion}</Badge>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
                <div className="flex items-center justify-between text-sm text-neutral-600">
                    <div className="flex items-center space-x-2">
                        <ion-icon name="git-branch-outline"></ion-icon>
                        <span>{project.branch}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <ion-icon name="calendar-outline"></ion-icon>
                        <span>Created: {new Date(project.created).toDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <ion-icon name="time-outline"></ion-icon>
                        <span>Updated: {new Date(project.updated).toDateString()}</span>
                    </div>
                </div>
                <Separator />
                <Tabs defaultValue="production" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="production">Production</TabsTrigger>
                        <TabsTrigger value="preview">Preview</TabsTrigger>
                    </TabsList>
                    <TabsContent value="production" className="mt-4">
                        <Card>
                            {
                                project.target?.production?.git ? (
                                    <CardContent className="p-4 space-y-4">
                                        <Collapsible>
                                            <CollapsibleTrigger className="flex items-center justify-between w-full p-2 bg-neutral-100 rounded-md">
                                                <div className="flex items-center space-x-2">
                                                    <ion-icon name="globe-outline" class="text-neutral-600"></ion-icon>
                                                    <span className="font-medium">Domains</span>
                                                </div>
                                                <ChevronDown className="h-4 w-4 text-neutral-500" />
                                            </CollapsibleTrigger>
                                            <CollapsibleContent className="mt-2 space-y-2">
                                                {
                                                    project.target.production.domains.map((domain, index) => (
                                                        <div key={index} className="flex items-center space-x-2 text-sm text-neutral-600">
                                                            <ion-icon name="link-outline"></ion-icon>
                                                            <span>{domain}</span>
                                                        </div>
                                                    ))
                                                }
                                            </CollapsibleContent>
                                        </Collapsible>
                                        <div className="space-y-2">
                                            <h4 className="font-medium text-neutral-700">Build Configuration</h4>
                                            <div className="bg-neutral-100 p-3 rounded-md text-sm text-neutral-600">
                                                <code>{project.target.production.build}</code>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <h4 className="font-medium text-neutral-700">Git Details</h4>
                                            <div className="grid grid-cols-2 gap-2 text-sm text-neutral-600">
                                                <div className="flex items-center space-x-2">
                                                    <ion-icon name="person-outline"></ion-icon>
                                                    <span>Author: {project.target.production.git.author}</span>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <ion-icon name="git-commit-outline"></ion-icon>
                                                    <span>Sha: {project.target.production.git.sha.substring(0,7)}</span>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <ion-icon name="git-branch-outline"></ion-icon>
                                                    <span>Branch: {project.target.production.git.branch}</span>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <ion-icon name="chatbox-outline"></ion-icon>
                                                    <span>Message: {project.target.production.git.message}</span>
                                                </div>
                                            </div>

                                        </div>
                                    </CardContent>
                                ) : (
                                    <CardContent className="p-4 space-y-4">
                                        <div className="text-center text-neutral-600">
                                            <ion-icon name="construct-outline" class="text-4xl mb-2"></ion-icon>
                                            <p>Production environment not configured</p>
                                        </div>
                                    </CardContent>
                                )
                            }
                        </Card>
                    </TabsContent>
                    <TabsContent value="preview" className="mt-4">
                        <Card>
                            {
                                project.target.preview?.git ? (
                                    <CardContent className="p-4 space-y-4">
                                        <Collapsible>
                                            <CollapsibleTrigger className="flex items-center justify-between w-full p-2 bg-neutral-100 rounded-md">
                                                <div className="flex items-center space-x-2">
                                                    <ion-icon name="globe-outline" class="text-neutral-600"></ion-icon>
                                                    <span className="font-medium">Domains</span>
                                                </div>
                                                <ChevronDown className="h-4 w-4 text-neutral-500" />
                                            </CollapsibleTrigger>
                                            <CollapsibleContent className="mt-2 space-y-2">
                                                {
                                                    project.target.preview.domains.map((domain, index) => (
                                                        <div key={index} className="flex items-center space-x-2 text-sm text-neutral-600">
                                                            <ion-icon name="link-outline"></ion-icon>
                                                            <span>{domain}</span>
                                                        </div>
                                                    ))
                                                }
                                            </CollapsibleContent>
                                        </Collapsible>
                                        <div className="space-y-2">
                                            <h4 className="font-medium text-neutral-700">Build Configuration</h4>
                                            <div className="bg-neutral-100 p-3 rounded-md text-sm text-neutral-600">
                                                <code>{project.target.preview.build}</code>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <h4 className="font-medium text-neutral-700">Git Details</h4>
                                            <div className="grid grid-cols-2 gap-2 text-sm text-neutral-600">
                                                <div className="flex items-center space-x-2">
                                                    <ion-icon name="person-outline"></ion-icon>
                                                    <span>Author: {project.target.preview.git.author}</span>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <ion-icon name="git-commit-outline"></ion-icon>
                                                    <span>Sha: {project.target.preview.git.sha.substring(0,7)}</span>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <ion-icon name="git-branch-outline"></ion-icon>
                                                    <span>Branch: {project.target.preview.git.branch}</span>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <ion-icon name="chatbox-outline"></ion-icon>
                                                    <span>Message: {project.target.preview.git.message}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                ) : (
                                    <CardContent className="p-4 space-y-4">
                                        <div className="text-center text-neutral-600">
                                            <ion-icon name="construct-outline" class="text-4xl mb-2"></ion-icon>
                                            <p>Preview environment not configured</p>
                                        </div>
                                    </CardContent>
                                )
                            }
                        </Card>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    )
}