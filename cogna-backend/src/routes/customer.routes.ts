import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { CustomerService } from '@/services/customer.service'
import { handleRouteError } from '@/utils/handle-error'
import { successResponse } from '@/utils/response'

const paginationSchema=z.object({page:z.coerce.number().int().min(1).default(1),limit:z.coerce.number().int().min(1).max(100).default(10)})
const orderQuerySchema=paginationSchema.extend({status:z.enum(['PENDING','PROCESSING','COMPLETED','FAILED','CANCELLED']).optional()})
const ticketSchema=z.object({subject:z.string().min(2),message:z.string().min(2),orderId:z.string().uuid().optional()})
const messageSchema=z.object({message:z.string().min(1)})
const idParams=z.object({id:z.string().min(1)})
const receiptParams=z.object({reference:z.string().min(1)})
const userId=(req:FastifyRequest)=>(req.user as {sub:string}).sub

export default async function customerRoutes(app:FastifyInstance){
 app.addHook('onRequest',app.authenticate)
 app.get('/customer/dashboard',async(req,reply)=>run(reply,async()=>successResponse(await CustomerService.dashboard(userId(req)))))
 app.get('/customer/orders',async(req,reply)=>run(reply,async()=>{const q=orderQuerySchema.parse(req.query);return successResponse(await CustomerService.listOrders(userId(req),q.page,q.limit,q.status))}))
 app.get('/customer/orders/:id',async(req,reply)=>run(reply,async()=>{const {id}=idParams.parse(req.params);return successResponse(await CustomerService.getOrder(userId(req),id))}))
 app.post('/customer/orders/:id/cancel',async(req,reply)=>run(reply,async()=>{const {id}=idParams.parse(req.params);return successResponse(await CustomerService.cancelOrder(userId(req),id),'Order cancelled successfully')}))
 app.get('/customer/receipts/:reference',async(req,reply)=>run(reply,async()=>{const {reference}=receiptParams.parse(req.params);return successResponse(await CustomerService.getReceipt(userId(req),reference))}))
 app.get('/customer/receipts/:reference/print',async(req,reply)=>{try{const {reference}=receiptParams.parse(req.params);const receipt=await CustomerService.getReceipt(userId(req),reference);const html=`<!doctype html><html><head><meta charset="utf-8"><title>Receipt ${escapeHtml(receipt.reference)}</title></head><body><main><h1>Cogna Marketplace</h1><h2>${escapeHtml(receipt.type)} receipt</h2><p>Reference: ${escapeHtml(receipt.reference)}</p><p>Customer: ${escapeHtml(receipt.user.fullName)} (${escapeHtml(receipt.user.email)})</p><p>Amount: ${escapeHtml(receipt.currency)} ${Number(receipt.amount).toFixed(2)}</p><p>Date: ${receipt.createdAt.toISOString()}</p></main></body></html>`;return reply.type('text/html').send(html)}catch(error){return handleRouteError(error,reply)}})
 app.get('/customer/support/tickets',async(req,reply)=>run(reply,async()=>{const q=paginationSchema.parse(req.query);return successResponse(await CustomerService.listTickets(userId(req),q.page,q.limit))}))
 app.post('/customer/support/tickets',async(req,reply)=>{try{const input=ticketSchema.parse(req.body);const result=await CustomerService.createTicket(userId(req),input);return reply.status(201).send(successResponse(result,'Support ticket created successfully'))}catch(error){return handleRouteError(error,reply)}})
 app.get('/customer/support/tickets/:id',async(req,reply)=>run(reply,async()=>{const {id}=idParams.parse(req.params);return successResponse(await CustomerService.getTicket(userId(req),id))}))
 app.post('/customer/support/tickets/:id/messages',async(req,reply)=>{try{const {id}=idParams.parse(req.params);const {message}=messageSchema.parse(req.body);const result=await CustomerService.addTicketMessage(userId(req),id,message);return reply.status(201).send(successResponse(result,'Message sent successfully'))}catch(error){return handleRouteError(error,reply)}})
 app.get('/customer/notifications',async(req,reply)=>run(reply,async()=>successResponse(await CustomerService.listNotifications(userId(req)))))
 app.post('/customer/notifications/:id/read',async(req,reply)=>run(reply,async()=>{const {id}=idParams.parse(req.params);return successResponse(await CustomerService.markNotificationRead(userId(req),id),'Notification marked as read')}))
}

async function run(reply:FastifyReply,action:()=>Promise<unknown>){try{return reply.send(await action())}catch(error){return handleRouteError(error,reply)}}
function escapeHtml(value:string){return value.replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]??char))}