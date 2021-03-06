import React from 'react';
import roundTo from 'round-to';
import Modal from 'components/Modal';
import Button from 'components/Button';
import Input from 'components/Input';
import Link from 'components/Link';
import appContainer from 'containers/App';
import dashboardContainer from 'containers/Dashboard';
import {formatCurrency} from '../../util';
import './WithdrawModal.scss';

const getInitialProps = () => ({
	isOpen: false,
	recipientAddress: '',
	amount: 0,
	isWithdrawing: false,
	isBroadcasting: false,
	txFee: 0,
	broadcast: false,
});

class WithdrawModal extends React.Component {
	state = getInitialProps();

	constructor(props) {
		super(props);
		this.initialState = this.state;
	}

	open = () => {
		this.setState({isOpen: true});
	};

	close = () => {
		this.setState(getInitialProps());
	};

	withdrawButtonHandler = async () => {
		this.setState({isWithdrawing: true});

		const currency = dashboardContainer.activeCurrency.symbol;
		const {recipientAddress: address, amount} = this.state;

		const {txFee, broadcast} = await appContainer.api.withdraw({
			currency,
			address,
			amount,
		});

		this.setState({txFee, broadcast});
	};

	confirmButtonHandler = async () => {
		this.setState({isBroadcasting: true});
		const {amount, currency, address} = await this.state.broadcast();

		// TODO: The notification should be clickable and open a block explorer for the currency.
		// We'll need to have a list of block explorers for each currency.
		// eslint-disable-next-line no-new
		new Notification('Successful withdrawal!', {
			body: `${amount} ${currency} sent to ${address}`,
		});

		this.close();
	};

	render() {
		const currencyInfo = dashboardContainer.activeCurrency;
		const maxAmount = currencyInfo.balance;
		const remainingBalance = roundTo(maxAmount - (this.state.amount + this.state.txFee), 8);
		const setAmount = amount => {
			this.setState({amount});
		};

		return (
			<div className="modal-wrapper">
				<Modal
					className="WithdrawModal"
					title={`Withdraw ${currencyInfo.name} (${currencyInfo.symbol})`}
					open={this.state.isOpen}
					onClose={this.close}
				>
					<React.Fragment>
						<div className="section">
							<label>Recipient:</label>
							<Input
								required
								value={this.state.recipientAddress}
								placeholder={`Enter ${currencyInfo.symbol} Address`}
								disabled={this.state.isWithdrawing}
								onChange={value => {
									this.setState({recipientAddress: value});
								}}
							/>
						</div>
						<div className="section">
							<label>Amount:</label>
							<div className="amount-inputs">
								<Input
									value={roundTo(this.state.amount, 8)}
									type="number"
									min={0}
									step="any"
									required
									disabled={this.state.isWithdrawing}
									onChange={value => {
										const amount = Number.parseFloat(value || 0);
										setAmount(amount);
									}}
									view={() => (
										<span>{currencyInfo.symbol}</span>
									)}
								/>
								<span className="separator">≈</span>
								<Input
									value={roundTo(this.state.amount * currencyInfo.cmcPriceUsd, 2)}
									type="number"
									min={0}
									step="any"
									required
									disabled={this.state.isWithdrawing}
									onChange={value => {
										const amount = Number.parseFloat(value || 0) / currencyInfo.cmcPriceUsd;
										setAmount(amount);
									}}
									view={() => (
										<span>USD</span>
									)}
								/>
								<Link
									onClick={() => {
										setAmount(maxAmount);
									}}
								>
									(Max)
								</Link>
							</div>
						</div>
						<div className="section">
							<div className="info">
								<span>Remaining balance:</span>
								<span className={remainingBalance < 0 ? 'negative-balance' : ''}>{remainingBalance} {currencyInfo.symbol}</span>
							</div>
							<div className={`info ${this.state.broadcast || 'hidden'}`}>
								<span>Network Fee:</span>
								<span>{this.state.txFee} {currencyInfo.symbol} ({formatCurrency(this.state.txFee * currencyInfo.cmcPriceUsd)})</span>
							</div>
						</div>
						{this.state.broadcast ? (
							<Button
								className="confirm-button"
								primary
								value="Confirm Network Fee"
								disabled={this.state.isBroadcasting}
								onClick={this.confirmButtonHandler}
							/>
						) : (
							<Button
								className="withdraw-button"
								primary
								value="Withdraw"
								disabled={
									!this.state.recipientAddress ||
									!this.state.amount ||
									remainingBalance < 0 ||
									this.state.isWithdrawing
								}
								onClick={this.withdrawButtonHandler}
							/>
						)}
					</React.Fragment>
				</Modal>
				<Button
					className="OpenModalButton"
					value="Withdraw"
					disabled={!currencyInfo.balance}
					onClick={this.open}
				/>
			</div>
		);
	}
}

export default WithdrawModal;
