package com.beaconmc.auth;

import java.util.concurrent.CompletableFuture;

public class AuthAPI {
    private static BeaconAuth plugin;

    protected static void setPlugin(BeaconAuth instance) {
        plugin = instance;
    }

    /**
     * 验证插件授权 (异步)
     * @param pluginName 插件名称 (在 Beacon 平台上的名称)
     * @return CompletableFuture<Boolean> 验证结果。如果验证成功返回 true，失败返回 false。
     */
    public static CompletableFuture<Boolean> verify(String pluginName) {
        if (plugin == null) {
            throw new IllegalStateException("BeaconAuth 插件未安装或未启用！");
        }
        return plugin.getAuthManager().verify(pluginName);
    }
    
    /**
     * 验证插件授权 (同步 - 警告：不要在主线程调用，否则会卡顿服务器)
     * @param pluginName 插件名称
     * @return boolean 验证结果
     */
    public static boolean verifySync(String pluginName) {
        try {
            return verify(pluginName).join();
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }
}
