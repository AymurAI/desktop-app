import { Info } from "phosphor-react";

import { Stack, Text } from "components";
import { colors } from "styles/tokens";

export default function Callout() {
	return (
		<Stack
			align="center"
			wrap="nowrap"
			css={{ width: 300, bg: "$infoSecondary", p: "$m" }}
		>
			<Info weight="regular" size={24} color={colors.infoPrimary} />
			<Text size="xs">
				Si utilizas tu cuenta de Google, no olvides utilizar siempre la misma
				cuenta habilitada por el juzgado.
			</Text>
		</Stack>
	);
}
