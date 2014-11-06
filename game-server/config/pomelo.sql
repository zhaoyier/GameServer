/*
Navicat MySQL Data Transfer

Source Server         : Pomelo
Source Server Version : 50704
Source Host           : localhost:3306
Source Database       : pomelo

Target Server Type    : MYSQL
Target Server Version : 50704
File Encoding         : 65001

Date: 2014-10-26 23:48:14
*/

SET FOREIGN_KEY_CHECKS=0;
-- ----------------------------
-- Table structure for `account`
-- ----------------------------
DROP TABLE IF EXISTS `Account`;
CREATE TABLE `Account` (
  `uid` bigint(20) NOT NULL,
  `recharge` int(11) unsigned NOT NULL,
  `vip` int(11) unsigned NOT NULL,
  `diamond` int(11) unsigned NOT NULL,
  `gold` int(11) unsigned NOT NULL,
  `create_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`uid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of account
-- ----------------------------
INSERT INTO `Account` VALUES ('1000000', '10', '110', '2014-10-26 23:16:41');

-- ----------------------------
-- Table structure for `accountlog`
-- ----------------------------
DROP TABLE IF EXISTS `AccountLog`;
CREATE TABLE `AccountLog` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `uid` bigint(20) NOT NULL,
  `channel` int(11) DEFAULT NULL COMMENT '1、支付宝',
  `affcode` int(11) NOT NULL COMMENT '1、充值\r\n2、赠送\r\n3、拍卖\r\n4、兑换',
  `currency` int(11) DEFAULT NULL COMMENT '1、钻石\r\n2、金币',
  `amount` int(11) NOT NULL,
  `transaction` varchar(64) DEFAULT NULL,
  `status` int(11) DEFAULT '1' COMMENT '0、失败\r\n1、成功',
  `create_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of AccountLog
-- ----------------------------

-- ----------------------------
-- Table structure for `gamerecord`
-- ----------------------------
DROP TABLE IF EXISTS `GameRecord`;
CREATE TABLE `GameRecord` (
  `uid` bigint(20) NOT NULL,
  `title` varchar(255) NOT NULL,
  `win` int(11) DEFAULT NULL,
  `lost` int(11) DEFAULT NULL,
  `tie` int(11) DEFAULT NULL,
  `create_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`uid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of GameRecord
-- ----------------------------

-- ----------------------------
-- Table structure for `handlog`
-- ----------------------------
DROP TABLE IF EXISTS `handlog`;
CREATE TABLE `handlog` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `uid` bigint(20) NOT NULL,
  `room` int(11) NOT NULL,
  `patterns` int(11) NOT NULL,
  `hands` varchar(64) NOT NULL,
  `create_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of handlog
-- ----------------------------

-- ----------------------------
-- Table structure for `test`
-- ----------------------------
DROP TABLE IF EXISTS `test`;
CREATE TABLE `test` (
  `uid` int(11) NOT NULL,
  `username` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`uid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of test
-- ----------------------------
INSERT INTO `Test` VALUES ('100', 'zhao');

-- ----------------------------
-- Table structure for `users`
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `uid` bigint(20) NOT NULL AUTO_INCREMENT,
  `username` varchar(64) NOT NULL,
  `password` varchar(64) NOT NULL,
  `create_time` datetime NOT NULL,
  `login_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`uid`)
) ENGINE=InnoDB AUTO_INCREMENT=1000001 DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of users
-- ----------------------------
INSERT INTO `Users` VALUES ('1000000', 'zhaoyier', '111111', '2014-10-26 23:13:43', '2014-10-26 23:13:49');

-- ----------------------------
-- Table structure for `usersbasic`
-- ----------------------------
DROP TABLE IF EXISTS `usersbasic`;
CREATE TABLE `usersbasic` (
  `uid` bigint(20) NOT NULL,
  `avatar` varchar(255) DEFAULT NULL,
  `mobile` varchar(32) DEFAULT NULL,
  `create_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`uid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of usersbasic
-- ----------------------------
