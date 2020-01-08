/*
# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
*/
'use strict';
const shim = require('fabric-shim');
const util = require('util');
 
var Chaincode = class {

  async Init(stub) {
    console.info('=========== Instantiated chaincode ===========');
    return shim.success();
  }

  async Invoke(stub) {
    let ret = stub.getFunctionAndParameters();
    console.info(ret);

    let method = this[ret.fcn];
    if (!method) {
      console.error('no function of name:' + ret.fcn + ' found');
      throw new Error('Received unknown function ' + ret.fcn + ' invocation');
    }
    try {
      let payload = await method(stub, ret.params);
      return shim.success(payload);
    } catch (err) {
      console.log(err);
      return shim.error(err);
    }
  }
  
  async addMember(stub, args){
    if (args.length != 3) {
      return shim.error('Incorrect number of arguments. Expecting 3');
    }
    let newMember = {};
    newMember.id=args[0];
    newMember.organization = args[1];
    newMember.role = args[2];

    await stub.putState(args[0], Buffer.from(JSON.stringify(newMember)));
    console.info('Ledger updated for key: '+ args[0] +'.');
  }

  async createOrder(stub, args){
    if (args.length != 7) {
      return shim.error('Incorrect number of arguments. Expecting 7');
    }

    let memberAsBytes = await stub.getState(args[1]);
    if (!memberAsBytes || memberAsBytes.toString().length <= 0) {
      throw new Error(args[1] + ' retailer does not exist');
    }
    let member = JSON.parse(memberAsBytes);
    if (member.role != "RETAILER"){
      throw new Error(args[1] + ' is not a retailer');
    }
    let foodContract={};
    foodContract.orderid=args[0];
    foodContract.retailerid=args[1];
    foodContract.mangoType=args[2];
    foodContract.mangoGrade=args[3];
    foodContract.quantity=args[4];
    foodContract.price=args[5];
    foodContract.initialPayment=args[6];
    foodContract.Status = "order initiated";

    await stub.putState(args[0], Buffer.from(JSON.stringify(foodContract)));
    console.info('Ledger updated for key: '+args[0]+'.');
  }

  async createRawFood(stub, args){
    if (args.length != 2) {
      return shim.error('Incorrect number of arguments. Expecting 2');
    }
    let orderAsBytes = await stub.getState(args[0]);
    if (!orderAsBytes || orderAsBytes.toString().length <= 0) {
      throw new Error(args[0] + ' order does not exist');
    }
    let memberAsBytes = await stub.getState(args[1]);
    if (!memberAsBytes || memberAsBytes.toString().length <= 0) {
      throw new Error(args[1] + ' farmer does not exist');
    }
    let member = JSON.parse(memberAsBytes);
    if (member.role != "FARMER"){
      throw new Error(args[1] + ' is not a farmer');
    }
    let foodContract = JSON.parse(orderAsBytes);
    var date = new Date();
    
    if(foodContract.Status=="order initiated"){
      foodContract.farmerid = args[1];
      foodContract.RawFoodProcessDate = date;
      foodContract.Status="Raw food has been created";
    }
    else{
      throw new Error('Order has not yet been initiated');
    }
    await stub.putState(args[0], Buffer.from(JSON.stringify(foodContract)));
    console.info('Ledger updated for key: '+args[0]+'.');
  }

  async manufacturingProcess(stub, args){
    if (args.length != 3) {
      return shim.error('Incorrect number of arguments. Expecting 3');
    }
    let orderAsBytes = await stub.getState(args[0]);
    if (!orderAsBytes || orderAsBytes.toString().length <= 0) {
      throw new Error(args[0] + ' order does not exist');
    }
    let memberAsBytes = await stub.getState(args[1]);
    if (!memberAsBytes || memberAsBytes.toString().length <= 0) {
      throw new Error(args[1] + ' manufacturer does not exist');
    }
    let member = JSON.parse(memberAsBytes);
    if (member.role != "MANUFACTURER"){
      throw new Error(args[1] + ' is not a manufacturer');
    }
    
    let foodContract = JSON.parse(orderAsBytes);
    var date = new Date();
    
    if(foodContract.Status=="Raw food has been created"){
      foodContract.manufacturingid = args[1];
      foodContract.BoughtFromFarmerAtPrice = args[2];
      foodContract.manufacturingProcessDate = date;
      foodContract.Status="with the manufacturer for processing";
    }
    else{
      throw new Error('Raw Food not yet created');
    }
    await stub.putState(args[0], Buffer.from(JSON.stringify(foodContract)));
    console.info('Ledger updated for key: '+args[0]+'.');
  }

  async wholesaleDistribute(stub, args){
    if (args.length != 3) {
      return shim.error('Incorrect number of arguments. Expecting 3');
    }
    let orderAsBytes = await stub.getState(args[0]);
    if (!orderAsBytes || orderAsBytes.toString().length <= 0) {
      throw new Error(args[0] + ' order does not exist');
    }
    let memberAsBytes = await stub.getState(args[1]);
    if (!memberAsBytes || memberAsBytes.toString().length <= 0) {
      throw new Error(args[1] + ' wholesaler does not exist');
    }
    let member = JSON.parse(memberAsBytes);
    if (member.role != "WHOLESALER"){
      throw new Error(args[1] + ' is not a wholesaler');
    }
    let foodContract = JSON.parse(orderAsBytes);
    var date = new Date();
    
    if(foodContract.Status=="with the manufacturer for processing"){
      foodContract.wholesaleid = args[1];
      foodContract.wholesalePrice = args[2];
      foodContract.WholesaleProcessDate = date;
      foodContract.Status="wholesaler distribute";
    }
    else{
      throw new Error('Order has not yet been initiated');
    }
    await stub.putState(args[0], Buffer.from(JSON.stringify(foodContract)));
    console.info('Ledger updated for key: '+args[0]+'.');
  }

  async initiateDelivery(stub, args){
    if (args.length != 3) {
      return shim.error('Incorrect number of arguments. Expecting 3');
    }
    let orderAsBytes = await stub.getState(args[0]);
    if (!orderAsBytes || orderAsBytes.toString().length <= 0) {
      throw new Error(args[0] + ' order does not exist');
    }
    let memberAsBytes = await stub.getState(args[1]);
    if (!memberAsBytes || memberAsBytes.toString().length <= 0) {
      throw new Error(args[1] + ' logistics does not exist');
    }
    let member = JSON.parse(memberAsBytes);
    if (member.role != "LOGISTICS"){
      throw new Error(args[1] + ' is not from the logistics company');
    }
    let foodContract = JSON.parse(orderAsBytes);
    var date = new Date();
    
    if(foodContract.Status=="wholesaler distribute"){
      foodContract.logisticsid = args[1];
      foodContract.ShippingPrice = args[2];
      foodContract.initiateDeliveryProcessDate = date;
      foodContract.Status="initiated delivery";
    }
    else{
      throw new Error('Wholesale has not yet been initiated');
    }
    await stub.putState(args[0], Buffer.from(JSON.stringify(foodContract)));
    console.info('Ledger updated for key: '+args[0]+'.'); 
  }

  async deliverToRetail(stub, args){
    if (args.length != 1) {
      return shim.error('Incorrect number of arguments. Expecting 1');
    }
    let orderAsBytes = await stub.getState(args[0]); 
    if (!orderAsBytes || orderAsBytes.toString().length <= 0) {
      throw new Error(args[0] + ' order does not exist');
    }
    let foodContract = JSON.parse(orderAsBytes);
    var date = new Date();
    
    if(foodContract.Status=="initiated delivery"){
      foodContract.OutForDeliveryProcessDate = date;
      foodContract.Status="Out for delivery";
    }
    else{
      throw new Error('Delivery has not yet been initiated');
    }
    await stub.putState(args[0], Buffer.from(JSON.stringify(foodContract)));
    console.info('Ledger updated for key: '+args[0]+'.'); 
  }

  async completeOrder(stub, args){
    if (args.length != 1) {
      return shim.error('Incorrect number of arguments. Expecting 1');
    }
    let orderAsBytes = await stub.getState(args[0]); 
    if (!orderAsBytes || orderAsBytes.toString().length <= 0) {
      throw new Error(args[0] + ' order does not exist');
    }
    let foodContract = JSON.parse(orderAsBytes);
    var date = new Date();
    
    if(foodContract.Status=="Out for delivery"){
      foodContract.AmountToPay=parseInt(foodContract.price) + parseInt(foodContract.ShippingPrice) - parseInt(foodContract.initialPayment);
      foodContract.ReachedRetailerDate = date;
      foodContract.PaidToWholesaler = false;
      foodContract.Status="Reached Retailer";
    }
    else{
      throw new Error('Delivery has been initiated but not yet out for delivery');
    }
    await stub.putState(args[0], Buffer.from(JSON.stringify(foodContract)));
    console.info('Ledger updated for key: '+args[0]+'.');
  }

  async AmountPaid(stub, args){
    if (args.length != 1) {
      return shim.error('Incorrect number of arguments. Expecting 1');
    }
    let orderAsBytes = await stub.getState(args[0]);
    if (!orderAsBytes || orderAsBytes.toString().length <= 0) {
      throw new Error(args[0] + ' order does not exist');
    }
    let foodContract = JSON.parse(orderAsBytes);
    
    if(foodContract.Status=="Reached Retailer"){
      foodContract.PaidToWholesaler = true;
      foodContract.Status="Amount Paid. Order Complete";
    }
    else{
      throw new Error('Delivery has not yet been received by the retailer');
    }
    await stub.putState(args[0], Buffer.from(JSON.stringify(foodContract)));
    console.info('Ledger updated for key: '+args[0]+'.');
  }

  async query(stub, args) {
    if (args.length != 1) {
      throw new Error('Incorrect number of arguments. Expecting 1');
    }

    let keyAsBytes = await stub.getState(args[0]);
    if (!keyAsBytes || keyAsBytes.toString().length <= 0) {
      throw new Error(args[0] + ' order does not exist: ');
    }
    console.log(keyAsBytes.toString());
    return keyAsBytes;
  }
};

shim.start(new Chaincode());