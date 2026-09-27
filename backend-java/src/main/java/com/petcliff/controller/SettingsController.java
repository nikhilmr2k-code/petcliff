package com.petcliff.controller;

import com.petcliff.config.PetCliffProperties;
import com.petcliff.entity.AdminSetting;
import com.petcliff.repository.AdminSettingRepository;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Public site settings for the storefront. The announcement banner is disabled by
 * default (kept toggle-able via the admin_settings "announcement" row) to preserve
 * the uncluttered luxury look. Response keys are snake_case to match the frontend.
 */
@RestController
@RequestMapping("/api/settings")
public class SettingsController {

    private final AdminSettingRepository adminSettingRepository;
    private final PetCliffProperties props;

    public SettingsController(AdminSettingRepository adminSettingRepository, PetCliffProperties props) {
        this.adminSettingRepository = adminSettingRepository;
        this.props = props;
    }

    @GetMapping("/public")
    public Map<String, Object> publicSettings() {
        Map<String, Object> out = new LinkedHashMap<>();
        boolean enabled = false;
        String text = "";

        AdminSetting setting = adminSettingRepository.findById("announcement").orElse(null);
        if (setting != null && setting.getValue() != null) {
            Object e = setting.getValue().get("enabled");
            Object t = setting.getValue().get("text");
            enabled = e instanceof Boolean b ? b : Boolean.parseBoolean(String.valueOf(e));
            text = t == null ? "" : t.toString();
        }

        out.put("announcement_enabled", enabled);
        out.put("announcement_text", text);
        out.put("free_shipping_threshold_cents", props.getFreeShippingThresholdCents());
        return out;
    }
}
