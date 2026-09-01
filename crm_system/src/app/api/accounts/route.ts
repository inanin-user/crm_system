import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import cache from '@/lib/cache';
import { v4 as uuid } from "uuid";
import { AccountDetailRow, AccountRow } from '@/types/auth';
import { RowDataPacket } from "mysql2";
import { LocationCode } from '@/types/location';
import bcrypt from 'bcryptjs';

// 获取账户列表（根据角色筛选）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');

    // 生成緩存鍵
    const cacheKey = `accounts_${role || 'all'}`;

    // 嘗試從緩存獲取
    const cachedData = cache.get<unknown[]>(cacheKey);

    if (cachedData) {
      return NextResponse.json({
        success: true,
        data: cachedData,
        cached: true
      });
    }

    let sql = `
      SELECT
        id,
        username,
        role,
        isActive,
        locations,
        lastLogin,
        createdAt,
        updatedAt,
        memberName,
        phone,
        herbalifePCNumber,
        joinDate,
        trainerIntroducer,
        referrer,
        quota,
        renewalCount,
        initialTickets,
        addedTickets,
        usedTickets
      FROM account_management
      WHERE isActive = ?
    `;

    const params: unknown[] = [true];

    // 如果查詢 member，則查詢所有會員類型
    if (role === 'member') {
      sql += `
        AND role IN (?, ?, ?)
      `;

      params.push(
        'member',
        'regular-member',
        'premium-member'
      );
    } else if (role) {
      sql += `
        AND role = ?
      `;

      params.push(role);
    }

    sql += `
      ORDER BY createdAt DESC
    `;

    const [accounts] = await db.query<AccountDetailRow[]>(sql, params);

    
    // MySQL JSON column -> JavaScript array
    for (const account of accounts) {
      if (typeof account.locations === 'string') {
        try {
          account.locations = JSON.parse(account.locations);
        } catch {
          account.locations = [];
        }
      }
    }

    // 緩存結果（2分鐘）
    cache.set(cacheKey, accounts, 2 * 60 * 1000);

    return NextResponse.json({
      success: true,
      data: accounts
    });

  } catch (error) {
    console.error('获取账户列表失败:', error);

    return NextResponse.json(
      {
        success: false,
        message: '获取账户列表失败'
      },
      { status: 500 }
    );
  }
}


// 添加新账户
export async function POST(request: NextRequest) {
  try {
    const {
      username,
      password,
      role,
      locations,
      memberName,
      phone,
      herbalifePCNumber,
      joinDate,
      trainerIntroducer,
      referrer,
      quota
    } = await request.json();

    // 验证必填字段
    if (!username || !password || !role) {
      return NextResponse.json(
        {
          success: false,
          message: '账号名、密码和角色都是必填项'
        },
        { status: 400 }
      );
    }

    // 如果是会员角色，验证会员专用字段
    const isMemberRole = [
      'member',
      'regular-member',
      'premium-member'
    ].includes(role);

    if (isMemberRole) {
      if (
        !memberName ||
        !phone ||
        !herbalifePCNumber ||
        !joinDate ||
        !trainerIntroducer
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              '会员账户需要提供姓名、电话、康寶萊PC/會員號碼、入會日期和教練介紹人'
          },
          { status: 400 }
        );
      }
    }

    // 验证地区权限
    const validLocations : LocationCode[] = Object.values(LocationCode)

    if (locations !== undefined && locations !== null) {

      if (!Array.isArray(locations)) {
        return NextResponse.json(
          {
            success: false,
            message: '地区权限必须是数组'
          },
          { status: 400 }
        );
      }

      const invalidLocations = locations.filter(
        (loc): loc is string  =>
          typeof loc !== 'string' ||
          !validLocations.includes(loc as LocationCode)
      );

      if (invalidLocations.length > 0) {
        return NextResponse.json(
          {
            success: false,
            message: '包含无效的地区权限'
          },
          { status: 400 }
        );
      }
    }

    // 统一处理用户名
    const normalizedUsername = username
      .toLowerCase()
      .trim();
    
    type AccountIdOnly = Pick<AccountRow, "id"> & RowDataPacket;
    // 检查用户名是否已存在
    const [existingRows] = await db.query<AccountIdOnly[]>(
      `
        SELECT id
        FROM account_management
        WHERE username = ?
        LIMIT 1
      `,
      [normalizedUsername]
    );

    const existingAccounts = existingRows;

    if (existingAccounts.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: '该账号名已存在'
        },
        { status: 400 }
      );
    }

    const accountLocations =
      locations !== undefined && locations !== null
        ? locations
        : [];

    const initialQuota = quota || 0;

    let sql = `
      INSERT INTO account_management (
        id,
        username,
        password,
        role,
        isActive,
        locations
      )
    `;
    const accountId = uuid();
    const salt = await bcrypt.genSalt(12);
    const encryptedPw = await bcrypt.hash(password, salt);
    const params: unknown[] = [
      accountId,
      normalizedUsername,
      encryptedPw,
      role,
      true,
      JSON.stringify(accountLocations)
    ];

    sql += `
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    // 会员额外字段
    if (isMemberRole) {
      sql = `
        INSERT INTO account_management (
          id,
          username,
          password,
          role,
          isActive,
          locations,
          memberName,
          phone,
          herbalifePCNumber,
          joinDate,
          trainerIntroducer,
          referrer,
          quota,
          renewalCount,
          initialTickets,
          addedTickets,
          usedTickets
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      params.length = 0;

      params.push(
        accountId,
        normalizedUsername,
        encryptedPw,
        role,
        true,
        JSON.stringify(accountLocations),
        memberName,
        phone,
        herbalifePCNumber,
        new Date(joinDate),
        trainerIntroducer,
        referrer || null,
        initialQuota,
        0,
        initialQuota,
        0,
        0
      );
    }

    await db.query(sql, params);

    // retrieve the newly created account to return in the response
    const [newRows] = await db.query<AccountDetailRow[]>(
      `
        SELECT *
        FROM account_management
        WHERE id = ?
        LIMIT 1
      `,
      [accountId]
    );

    const newAccount = newRows[0];

    if (newAccount && typeof newAccount.locations === 'string') {
      try {
        newAccount.locations =
          JSON.parse(newAccount.locations);
      } catch {
        newAccount.locations = [];
      }
    }

    // 清除相關緩存
    cache.delete('accounts_all');
    cache.delete(`accounts_${role}`);

    // 如果是任何會員類型，都清除 accounts_member 緩存
    if (isMemberRole) {
      cache.delete('accounts_member');
    }

    return NextResponse.json({
      success: true,
      message: '账户创建成功',
      data: newAccount
    });

  } catch (error) {
    console.error('创建账户失败:', error);

    return NextResponse.json(
      {
        success: false,
        message: '创建账户失败'
      },
      { status: 500 }
    );
  }
}