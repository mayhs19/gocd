/*
 * Copyright 2018 ThoughtWorks, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.thoughtworks.go.server.newsecurity.filters;

import com.thoughtworks.go.config.CruiseConfig;
import com.thoughtworks.go.config.SecurityConfig;
import com.thoughtworks.go.listener.ConfigChangedListener;
import com.thoughtworks.go.listener.PluginRoleChangeListener;
import com.thoughtworks.go.listener.SecurityConfigChangeListener;
import com.thoughtworks.go.server.newsecurity.models.AuthenticationToken;
import com.thoughtworks.go.server.newsecurity.utils.SessionUtils;
import com.thoughtworks.go.server.service.GoConfigService;
import com.thoughtworks.go.server.service.PluginRoleService;
import com.thoughtworks.go.util.Clock;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

@Component
public class InvalidateAuthenticationOnSecurityConfigChangeFilter extends OncePerRequestFilter implements ConfigChangedListener, PluginRoleChangeListener {
    public static final String SECURITY_CONFIG_LAST_CHANGE = "GOCD_SECURITY_CONFIG_LAST_CHANGED_TIME";
    private static final Logger LOGGER = LoggerFactory.getLogger(InvalidateAuthenticationOnSecurityConfigChangeFilter.class);
    private SecurityConfig securityConfig;
    private GoConfigService goConfigService;
    private Clock clock;
    private PluginRoleService pluginRoleService;
    private volatile long lastChangedTime;

    @Autowired
    public InvalidateAuthenticationOnSecurityConfigChangeFilter(GoConfigService goConfigService,
                                                                Clock clock,
                                                                PluginRoleService pluginRoleService) {
        this.goConfigService = goConfigService;
        this.clock = clock;
        this.pluginRoleService = pluginRoleService;
    }

    public void initialize() {
        pluginRoleService.register(this);
        goConfigService.register(this);
        goConfigService.register(new SecurityConfigChangeListener() {
            @Override
            public void onEntityConfigChange(Object entity) {
                updateLastChangedTime();
            }
        });
    }

    private void updateLastChangedTime() {
        lastChangedTime = clock.currentTimeMillis();
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        if (!SessionUtils.hasAuthenticationToken(request)) {
            LOGGER.debug("Skipping filter, request is not authenticated.");
            filterChain.doFilter(request, response);
            return;
        }

        final AuthenticationToken<?> authentication = SessionUtils.getAuthenticationToken(request);
        synchronized (request.getSession(false).getId().intern()) {
            long localCopyOfLastChangedTime = lastChangedTime;//This is so that the volatile variable is accessed only once.
            Long previousLastChangedTime = (Long) request.getSession().getAttribute(SECURITY_CONFIG_LAST_CHANGE);
            if (previousLastChangedTime == null) {
                request.getSession().setAttribute(SECURITY_CONFIG_LAST_CHANGE, localCopyOfLastChangedTime);
            } else if (previousLastChangedTime < localCopyOfLastChangedTime) {
                request.getSession().setAttribute(SECURITY_CONFIG_LAST_CHANGE, localCopyOfLastChangedTime);
                authentication.invalidate();
            }
        }
        filterChain.doFilter(request, response);
    }

    @Override
    public void onConfigChange(CruiseConfig newCruiseConfig) {
        SecurityConfig newSecurityConfig = securityConfig(newCruiseConfig);
        if (this.securityConfig != null && !this.securityConfig.equals(newSecurityConfig)) {
            LOGGER.info("[Configuration Changed] Security Configuration is changed. Updating the last changed time.");
            updateLastChangedTime();
        }
        this.securityConfig = newSecurityConfig;
    }

    private SecurityConfig securityConfig(CruiseConfig newCruiseConfig) {
        return newCruiseConfig.server().security();
    }

    @Override
    public void onPluginRoleChange() {
        updateLastChangedTime();
    }
}