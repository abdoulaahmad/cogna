import type { OrderStatus } from '@prisma/client'
import { CustomerRepository } from '@/repositories/customer.repository'
import { ForbiddenError, NotFoundError, ValidationError } from '@/utils/errors'

function owned<T extends {userId:string}>(value:T|null,label:string,userId:string):T{if(!value)throw new NotFoundError(label);if(value.userId!==userId)throw new ForbiddenError('Resource ownership validation failed');return value}
export const CustomerService={
 async dashboard(userId:string){const wallet=await CustomerRepository.getWallet(userId);const [pendingCount,completedCount,recentOrders,recentTransactions]=await Promise.all([CustomerRepository.countOrders(userId,'PENDING'),CustomerRepository.countOrders(userId,'COMPLETED'),CustomerRepository.recentOrders(userId),CustomerRepository.recentTransactions(wallet.id)]);return {wallet:{availableBalance:Number(wallet.availableBalance),pendingBalance:Number(wallet.pendingBalance),lifetimeFunded:Number(wallet.lifetimeFunded),lifetimeSpent:Number(wallet.lifetimeSpent)},orderStats:{pendingCount,completedCount},recentOrders,recentTransactions,actionLinks:{fundWallet:'/wallet/fund',browseCatalog:'/catalog'}}},
 listOrders:(userId:string,page:number,limit:number,status?:OrderStatus)=>CustomerRepository.listOrders(userId,page,limit,status),
 async getOrder(userId:string,id:string){const order=owned(await CustomerRepository.findOrderDetails(id),'Order',userId);const receipt=await CustomerRepository.findOrderReceipt(id);return {...order,receiptReference:receipt?.reference??null}},
 async cancelOrder(userId:string,id:string){const r=await CustomerRepository.cancelOrder(userId,id);if(r.kind==='NOT_FOUND')throw new NotFoundError('Order');if(r.kind==='FORBIDDEN')throw new ForbiddenError('Resource ownership validation failed');if(r.kind==='INVALID_STATE')throw new ValidationError('Order cannot be cancelled at this stage');if(r.kind==='WALLET_NOT_FOUND')throw new NotFoundError('Wallet');return r.order},
 async getReceipt(userId:string,reference:string){return owned(await CustomerRepository.findReceipt(reference),'Receipt',userId)},
 listTickets:(userId:string,page:number,limit:number)=>CustomerRepository.listTickets(userId,page,limit),
 async createTicket(userId:string,input:{subject:string;message:string;orderId?:string}){if(input.orderId)owned(await CustomerRepository.findOrder(input.orderId),'Order',userId);return CustomerRepository.createTicket(userId,input.subject,input.message,input.orderId)},
 async getTicket(userId:string,id:string){return owned(await CustomerRepository.findTicketDetails(id),'Support ticket',userId)},
 async addTicketMessage(userId:string,id:string,message:string){owned(await CustomerRepository.findTicket(id),'Support ticket',userId);return CustomerRepository.addTicketMessage(id,userId,message)},
 listNotifications:(userId:string)=>CustomerRepository.listNotifications(userId),
 async markNotificationRead(userId:string,id:string){owned(await CustomerRepository.findNotification(id),'Notification',userId);return CustomerRepository.markNotificationRead(id)},
}